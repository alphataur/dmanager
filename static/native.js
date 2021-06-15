window.onload = function(){
  var youtubeResp = undefined
  var uniResp = undefined
  var youtubeURI = "http://localhost:3000/add/youtube"
  var uniURI = "http://localhost:3000/add/uni"
  var youtubeHash = undefined
  var uniHash = undefined

  function setUni(res){
    console.log(res)
  }
  function setYoutube(res){
    console.log(res)
  }
  $("#youtube").on("click", ()=>{
    //post here
    console.log(document.querySelector("#youtubelink").value)
    console.log(youtubeURI)
    fetch(youtubeURI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uri: document.querySelector("#youtubelink").value,
      }),
    }).then((body)=>{
      return body.json()
    }).then((json)=>{
      if(json.hash !== undefined)
        $("#youtubeHash").text(json.hash)
    })
    return false
  })
  $("#uni").on("click", ()=>{
    fetch(uniURI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uri: document.querySelector("#unilink").value,
        fpath: document.querySelector("#unipath").value,
      }),
    }).then((body)=>body.json())
      .then((json)=>{
        if(json.hash !== undefined)
          $("#uniHash").text(json.hash)
      })
    return false
  })

}
