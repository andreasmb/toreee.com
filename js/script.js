function AppData() {
  return {
    items: [],
    loadError: false,
    loading: true,
    dots: '.',
    dotsTimer: null,

    loadItems: function() {
      this.items = [];
      this.loadError = false;
      this.loading = true;
      this.startDots();

      if (typeof window.env === 'undefined') {
        console.error("Environment variables are not defined.");
        this.loadError = true;
        this.handleFailure();
        return;
      }

      this.fetchPage(window.env.AIRTABLE_BASE_ID, window.env.AIRTABLE_API_KEY, null);
    },

    startDots: function() {
      var self = this;
      this.dots = '.';
      this.stopDots();
      this.dotsTimer = setInterval(function() {
        self.dots = self.dots.length >= 3 ? '.' : self.dots + '.';
      }, 400);
    },

    stopDots: function() {
      if (this.dotsTimer) {
        clearInterval(this.dotsTimer);
        this.dotsTimer = null;
      }
    },

    finishLoading: function() {
      this.loading = false;
      this.stopDots();
    },

    // Live data loaded successfully — reveal the live app. The prerendered
    // static fallback was never shown, so there's nothing to fade out.
    handleSuccess: function() {
      this.finishLoading();
      $('#app').fadeIn('slow');
      $('#kontakt').fadeIn('slow');
    },

    // Live data failed to load (missing env vars, network error, etc). Fall
    // back to the prerendered static content if it has anything real in it;
    // otherwise fall back to #app's own error message.
    handleFailure: function() {
      this.finishLoading();
      $('#kontakt').fadeIn('slow');
      if ($('#static-items .publikasjon').length > 0) {
        $('#static-items').fadeIn('slow');
      } else {
        $('#app').fadeIn('slow');
      }
    },

    fetchPage: function(appId, appKey, offset) {
      var self = this;
      var url = "https://api.airtable.com/v0/" + appId + "/Menu?view=Grid%20view" +
        (offset ? "&offset=" + offset : "");

      axios.get(url, {
        headers: { Authorization: "Bearer " + appKey }
      }).then(function(response) {
        // Skip incomplete/draft Airtable rows (no title) — they'd otherwise
        // render as an empty layout shell with nothing but a divider line.
        var records = response.data.records.filter(function(record) {
          return !!(record.fields && record.fields['prosjekt-navn'] && record.fields['prosjekt-navn'].trim());
        });
        self.items = self.items.concat(records);

        if (response.data.offset) {
          // Airtable paginates at 100 records per request; keep following the offset.
          self.fetchPage(appId, appKey, response.data.offset);
        } else {
          self.handleSuccess();
          // Wait for petite-vue's DOM update before converting the rendered markdown.
          PetiteVue.nextTick(convertMarkdown);
        }
      }).catch(function(error) {
        console.log(error);
        self.loadError = true;
        self.handleFailure();
      });
    },

    photoUrl: function(item, field) {
      var attachments = item && item.fields && item.fields[field];
      var thumb = attachments && attachments[0] && attachments[0].thumbnails && attachments[0].thumbnails.large;
      return thumb ? thumb.url : '';
    }
  };
}

PetiteVue.createApp({ AppData }).mount();

// Convert markdown to html. Scoped to #app only — #static-items already has
// its markdown converted at build time (see scripts/prerender.js), and
// re-running it through .text() + makeHtml() here would strip that
// formatting (bold/italic/links) back out.
function convertMarkdown() {
  $("#app .presse-beskrivelse").each(function(index) {
    var converter = new showdown.Converter();
    var md = $(this).text();
    var html = converter.makeHtml(md);
    $(this).html(html);
  });

  $("#app .min-beskrivelse").each(function(index) {
    var converter = new showdown.Converter();
    var md = $(this).text();
    var html = converter.makeHtml(md);
    $(this).html(html);
  });
}

$(document).ready(function() {
  // #app, #static-items, #name, #name-desc, and #kontakt all already start
  // with the "hidden" CSS class in the HTML, so there's no need to also
  // .hide() them here — doing so raced against handleSuccess()/
  // handleFailure()'s fadeIn() calls (which can fire synchronously, before
  // this ready callback, when loading fails immediately) and silently
  // undid them.
  $('#name').fadeIn("slow");
  $('#name-desc').delay(500).fadeIn("slow");

  // Set the current year dynamically
  var currentYear = new Date().getFullYear();
  $('#year').text(currentYear);
});
