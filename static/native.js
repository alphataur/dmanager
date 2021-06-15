window.onload = function(){
  var youtubeResp = undefined
  var uniResp = undefined
  var youtubeURI = "http://localhost:3000/add/youtube"
  var uniURI = "http://localhost:3000/add/uni"
  var base = "http://localhost:3000/"
  var youtubeHash = undefined
  var uniHash = undefined
  var ws = new WebSocket("ws://localhost:3001")
  var data = undefined
  var youtubeprogress = 0;

  function encase(){
    var interval = setInterval(()=>{
      if(youtubeHash !== undefined)
        fetch(base+youtubeHash).then((body)=>body.json()).then((data)=>{
          youtubeprogress = (data.offset / data.length) * 100
          $("#youtubename").text(data.fpath)
          $("#youtubepercentage").text(youtubeprogress)
          $("#youtubeprogress").attr("value", youtubeprogress)
          if(data.completed)
            clearInterval(interval)
        }).catch(console.log)
    },2000)
  }

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
      if(json.hash !== undefined){
        $("#youtubeHash").text(json.hash)
        youtubeHash = json.hash
        encase()
      }
    }).catch(console.log)
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
        if(json.hash !== undefined){
          $("#uniHash").text(json.hash)
          uniHash = json.hash
        }
      }).catch(console.log)
    return false
  })

}
