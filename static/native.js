window.onload = function(){
  var youtubeResp = undefined
  var uniResp = undefined

  var base = "http://localhost:3000/download/"
  
  var youtubeURI = base+"youtube/add"
  var uniURI = base + "uni/add"

  var youtubeHashURI = base + "uni/"
  var uniHashURI = base + "uni/"

  var youtubeHash = undefined
  var uniHash = undefined
  var ws = new WebSocket("ws://localhost:3001")
  var data = undefined
  var youtubeprogress = 0;

  function encase(){
    var interval = setInterval(()=>{
      if(youtubeHash !== undefined)
        console.log(youtubeHashURI+youtubeHash)
        fetch(youtubeHashURI+youtubeHash).then((body)=>body.json()).then((data)=>{
          youtubeprogress = (data.result.offset / data.result.length) * 100
          $("#youtubename").text(data.result.fpath)
          $("#youtubepercentage").text(youtubeprogress)
          $("#youtubeprogress").attr("value", youtubeprogress)
          if(data.completed)
            clearInterval(interval)
        }).catch(console.log)
    },2000)
  }

  function tars(){
    var interval = setInterval(()=>{
      if(uniHash !== undefined)
        fetch(uniHashURI+uniHash).then((body)=>body.json()).then((data)=>{
          uniprogress = (data.result.offset / data.result.length) * 100
          $("#uniname").text(data.result.fpath)
          $("#unipercentage").text(uniprogress)
          $("#uniprogress").attr("value", uniprogress)
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
        $("#youtubeHash").attr("href", youtubeHashURI+json.hash)
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
          tars()
        }
      }).catch(console.log)
    return false
  })

}
