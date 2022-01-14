const express = require("express");
const { google } = require("googleapis");
const Query = require("minecraft-query");
const ejs = require("ejs")

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/views/css'));

function pakkaaja(tiedot, nimet) {
  for (var i = 0; i < nimet.length; i++) {
    lahetys.append(nimet[i][0])
    console.log(nimet[i])
    lahetys[i] = tiedot[i]
  }
}

var taulukko = []
var palvelin = []
async function tiedot() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const client = await auth.getClient();

  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "";

  const range = "Taulukko1!A2:N"; 

  const request = {spreadsheetId: spreadsheetId, range: range,};

  const tiedot = await googleSheets.spreadsheets.values.get(request, (err, { data }) => {
    if (err) {
      console.log(err);
      return;
    }
    const max = data.values.reduce((c, e) => {
      const len = e.length;
      return c < len ? len : c;
    }, 0);
    const values = data.values.map((e) => {
      const len = e.length;
      return len < max ? e.concat(Array(max - len).fill("")) : e;
    });
    taulukko = values
  });

  const q = new Query({host: 'mc.esimerkki.fi', port: 25565, timeout: 7500});

  palvelin = await q.fullStat()
  .catch (err => {
    return "Virhe";
  })
}


app.get("/", (req, res) => {
  res.render("index.ejs", {"palvelin": palvelin});
});

app.get("/tiedot", async (req, res) => {
  try {
  res.json(taulukko);
  } catch {
  res.redirect("/");
  }
});

app.get("/:pelaaja", async (req, res) => {
  try {
    var jatko = true;
    for (var i = 1; i < taulukko.length; i++) {
      var nimi = new RegExp(taulukko[i][0], "i");
      if (nimi.test(req.params.pelaaja)) {
        jatko = false
        res.render("pelaaja.ejs", {"data": taulukko[i], "palvelin": palvelin}); 
      }
    }
    if (jatko) {
      res.redirect("/"); 
    }
  } catch {
  res.redirect("/");
  }
});


app.listen(1228, (req, res) => console.log("Kaynnissa. Portti: 1228"));
tiedot()
setInterval(tiedot, 1000 * 60);
