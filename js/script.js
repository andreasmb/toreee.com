$(document).ready(function() {
  $("#app").hide();
  $("#name").hide();
  $("#name-desc").hide();
  $("#kontakt").hide();

  console.log('Environment Variables at start:', window.env);

  var app = new Vue({
    el: '#app',
    data: {
      items: []
    },
    mounted: function() {
      this.loadItems();
    },
    methods: {
      loadItems: function() {
        // Init variables
        var self = this;

        // Use the injected environment variables
        if (typeof window.env !== 'undefined') {
          console.log('Environment Variables:', window.env);
          var app_id = window.env.AIRTABLE_BASE_ID;
          var app_key = window.env.AIRTABLE_API_KEY;

          this.items = [];
          axios.get(
            "https://api.airtable.com/v0/" + app_id + "/Menu?view=Grid%20view",
            {
              headers: { Authorization: "Bearer " + app_key }
            }
          ).then(function(response) {
            self.items = response.data.records;
            setTimeout(convertMarkdown, 1500);
          }).catch(function(error) {
            console.log(error);
          });
        } else {
          console.error("Environment variables are not defined.");
        }
      }
    }
  });

  $('#name').fadeIn("slow");
  $('#name-desc').delay(500).fadeIn("slow");
  $('#app').delay(1500).fadeIn("slow");
  $('#kontakt').delay(1600).fadeIn("slow");

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

  // Set the current year dynamically
  var currentYear = new Date().getFullYear();
  $('#year').text(currentYear);
});
