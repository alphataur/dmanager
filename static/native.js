window.onload = function(){
  var youtubeResp = undefined
  var uniResp = undefined
  function setUni(res){
    console.log(res)
  }
  function setYoutube(res){
    console.log(res)
  }
  $("#youtube").on("click", ()=>{
    //post here
    console.log(document.querySelector("#youtubelink").value)
    fetch({
      method: "POST",
      uri: "/add/youtube",
      data: {
        uri: document.querySelector("#youtubelink").value,
      },
    })
  })
  $("#uni").on("click", ()=>{
    fetch({
      method: "POST",
      uri: "/add/uni",
      data: {
        uri: document.querySelector("#unilink").value,
        fpath: document.querySelector("#unipath").value,
      },
    })
  })

}
