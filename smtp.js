/* SmtpJS.com - v3.0.0 */
var Email = {
    send: (a) =>
      new Promise((n, e) => {
        ;(a.nocache = Math.floor(1e6 * Math.random() + 1)), (a.Action = "Send")
        var t = JSON.stringify(a)
        Email.ajaxPost("https://smtpjs.com/v3/smtpjs.aspx?", t, (e) => {
          n(e)
        })
      }),
    ajaxPost: (e, n, t) => {
      var a = Email.createCORSRequest("POST", e)
      a.setRequestHeader("Content-type", "application/x-www-form-urlencoded"),
        (a.onload = () => {
          var e = a.responseText
          null != t && t(e)
        }),
        a.send(n)
    },
    ajax: (e, n) => {
      var t = Email.createCORSRequest("GET", e)
      ;(t.onload = () => {
        var e = t.responseText
        null != n && n(e)
      }),
        t.send()
    },
    createCORSRequest: (e, n) => {
      var t = new XMLHttpRequest()
      return (
        "withCredentials" in t
          ? t.open(e, n, !0)
          : "undefined" != typeof XDomainRequest
            ? (t = new XDomainRequest()).open(e, n)
            : (t = null),
        t
      )
    },
  }
  