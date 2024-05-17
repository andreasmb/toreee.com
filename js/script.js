

$( document ).ready(function() {

  $("#app").hide();
  $("#name").hide();
  $("#name-desc").hide();
  $("#kontakt").hide();

  var app = new Vue({
      el: '#app',
      data: {
          items: []
      },
      mounted: function(){
         this.loadItems();
      },
      methods: {
          loadItems: function(){

              // Init variables
              var self = this

              var app_id = "appWjWl1OCktfyHo0";
              var app_key = "patHYTNk8NQFCZLkK.63a6c67d2585ff4222dbb7f735692a8415de7e07c27c93a9c725239f11ad6de7";


              this.items = []
              axios.get(
                  "https://api.airtable.com/v0/"+app_id+"/Menu?view=Grid%20view",
                  {
                      headers: { Authorization: "Bearer "+app_key }
                  }
              ).then(function(response){
                  self.items = response.data.records
                  setTimeout(convertMarkdown, 1500);

              }).catch(function(error){
                  console.log(error)
              })
          }
      }
  })


  $('#name').fadeIn("slow");
  $('#name-desc').delay(500).fadeIn("slow");
  $('#app').delay(1500).fadeIn("slow");
  $('#kontakt ').delay(1600).fadeIn("slow");

  // Convert markdown to html

  function convertMarkdown() {

    $( ".presse-beskrivelse" ).each(function(index) {
      var converter = new showdown.Converter();
      var md = $(this).text();
      var html = converter.makeHtml(md);
      $(this).html(html);
    });

    $( ".min-beskrivelse" ).each(function(index) {
      var converter = new showdown.Converter();
      var md = $(this).text();
      var html = converter.makeHtml(md);
      $(this).html(html);
    });
  }

});
