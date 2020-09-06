

new WOW().init();

$( document ).ready(function() {

  // $("body").css("display", "none");
  //
  $("#app").hide();
  $("#name").hide();
  $("#name-desc").hide();
  $("#kontakt").hide();
  //
  // console.log("APP", $("body"));
  //
  // $("body").fadeIn();


  // $('#app').delay(155)({'opacity': 1}, 1000);

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
              var app_key = "keym8ucVtuq8SCzZF";


              this.items = []
              axios.get(
                  "https://api.airtable.com/v0/"+app_id+"/Menu?view=Grid%20view",
                  {
                      headers: { Authorization: "Bearer "+app_key }
                  }
              ).then(function(response){
                  self.items = response.data.records
              }).catch(function(error){
                  console.log(error)
              })
          }
      }
  })


  $('#name').fadeIn("slow");
  $('#name-desc').delay(500).fadeIn("slow");
  $('#app').delay(1000).fadeIn("slow");
  $('#kontakt ').delay(1000).fadeIn("slow");


});
