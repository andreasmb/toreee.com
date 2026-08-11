#!/usr/bin/env node
'use strict';

// Fetches all records from Airtable and bakes them into a static HTML block
// inside index.html, so crawlers and link-preview bots (which don't run
// JavaScript) see real content on first load. The existing petite-vue app
// is untouched — it still mounts and fetches live data for real visitors;
// js/script.js hides the static block once the live one is ready.

const fs = require('fs');
const path = require('path');
const showdown = require('showdown');

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const MARKER = '<!-- PRERENDER:ITEMS -->';
const INDEX_PATH = path.join(__dirname, '..', 'index.html');

async function fetchAllRecords() {
  const records = [];
  let offset;

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Menu`);
    url.searchParams.set('view', 'Grid view');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!res.ok) {
      throw new Error(`Airtable request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function photoUrl(item, field) {
  const attachments = item && item.fields && item.fields[field];
  const thumb = attachments && attachments[0] && attachments[0].thumbnails && attachments[0].thumbnails.large;
  return thumb ? thumb.url : '';
}

function renderItem(item, converter) {
  const f = item.fields || {};
  const category = escapeHtml(f['type-prosjekt']);
  const title = escapeHtml(f['prosjekt-navn']);
  const date = escapeHtml(f['dato']);
  const linkLabel = escapeHtml(f['ekstern-link-label']);
  const link = f['ekstern-link'] ? escapeHtml(f['ekstern-link']) : '';
  const photo = photoUrl(item, 'photo');
  const photoVert = photoUrl(item, 'photo-vertikal');
  const minB = converter.makeHtml(f['min-beskrivelse'] || '');
  const presseB = converter.makeHtml(f['presse-beskrivelse'] || '');

  let imagesHtml = '';
  if (photo) imagesHtml += `<img src="${photo}" alt="" class="mb-8 w-full">`;
  if (photoVert) imagesHtml += `<img src="${photoVert}" alt="" class="vertikalt-bilde mb-8 w-auto">`;
  const imagesBlock = imagesHtml ? (link ? `<a href="${link}" target="_blank">${imagesHtml}</a>` : imagesHtml) : '';
  const linkBlock = link ? `<a class="text mb-2 text-sm" href="${link}">${linkLabel}</a>` : '';

  return `<div class="publikasjon mb-16 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-12 md:gap-x-8">
        <div class="col-span-12 sm:col-span-12 md:col-span-3 min-w-0">
          <div class="flex items-start line-row mb-2 md:mb-0 text-lg uppercase text-pale-oak">
            <span class="px-2">${category}</span>
            <span class="line-segment line-offset flex-1 ml-2 md:-mr-8"></span>
          </div>
        </div>
        <div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-7 min-w-0">
          <div class="mb-10">
            <div class="flex items-start line-row text-lg text-white uppercase mb-6">
              <span class="px-2">${title}</span>
              <span class="line-segment line-offset flex-1 ml-2 md:-mr-8 hidden md:block"></span>
            </div>
            <div class="px-2 min-w-32">
              ${imagesBlock}
              <p class="mb-2 min-beskrivelse">${minB}</p>
              <p class="mb-2 presse-beskrivelse">${presseB}</p>
              ${linkBlock}
            </div>
          </div>
        </div>

        <div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-2 min-w-0">
          <div class="flex items-start line-row text-xs md:text-base text-pale-oak">
            <span class="line-segment line-offset flex-1 mr-2 hidden md:block"></span>
            <span class="px-2">${date}</span>
          </div>
        </div>
      </div>`;
}

async function main() {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    console.error('AIRTABLE_BASE_ID / AIRTABLE_API_KEY not set — skipping prerender, deploy continues with an empty static fallback.');
    return;
  }

  const source = fs.readFileSync(INDEX_PATH, 'utf8');
  if (!source.includes(MARKER)) {
    console.error(`Prerender marker ${MARKER} not found in index.html — skipping.`);
    return;
  }

  let records;
  try {
    records = await fetchAllRecords();
  } catch (err) {
    console.error('Could not fetch Airtable data for prerendering, leaving index.html unchanged:', err.message);
    return;
  }

  const converter = new showdown.Converter();
  const itemsHtml = records.map((item) => renderItem(item, converter)).join('\n');

  fs.writeFileSync(INDEX_PATH, source.replace(MARKER, itemsHtml));
  console.log(`Prerendered ${records.length} item(s) into index.html`);
}

main().catch((err) => {
  console.error('Prerender step failed, continuing deploy with empty static fallback:', err);
});
