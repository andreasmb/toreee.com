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

    // Live data loaded successfully — hand off from the prerendered static
    // fallback to the live app instead of on a fixed timer.
    handleSuccess: function() {
      this.finishLoading();
      $('#static-items').fadeOut('slow');
      $('#app').fadeIn('slow');
      $('#kontakt').fadeIn('slow');
    },

    // Live data failed to load (missing env vars, network error, etc). If the
    // prerendered static fallback already has real content, leave it showing
    // instead of hiding it in favor of an empty/error #app.
    handleFailure: function() {
      this.finishLoading();
      $('#kontakt').fadeIn('slow');
      if ($('#static-items .publikasjon').length === 0) {
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
        self.items = self.items.concat(response.data.records);

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

// Convert markdown to html
function convertMarkdown() {
  $(".presse-beskrivelse").each(function(index) {
    var converter = new showdown.Converter();
    var md = $(this).text();
    var html = converter.makeHtml(md);
    $(this).html(html);
  });

  $(".min-beskrivelse").each(function(index) {
    var converter = new showdown.Converter();
    var md = $(this).text();
    var html = converter.makeHtml(md);
    $(this).html(html);
  });
}

$(document).ready(function() {
  $("#app").hide();
  $("#name").hide();
  $("#name-desc").hide();
  $("#kontakt").hide();

  $('#name').fadeIn("slow");
  $('#name-desc').delay(500).fadeIn("slow");

  // Set the current year dynamically
  var currentYear = new Date().getFullYear();
  $('#year').text(currentYear);
});
