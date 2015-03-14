var url = 'data/giants2015schedule.json';
var today = new Date();
var nextGame = null;
var todaysGame = null;
var linescore_url_dyn = '';
var linescore_url_root = 'http://gd2.mlb.com/components/game/mlb/year_2015/';
var y_url = '';
var opponent, gameFinished = false, result = 'won';
var giantsRuns, opponentRuns;

function isDateLaterThan(a, b) {
  return a > b;
}

function refreshPage() {
  location.reload();
}

/* from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date */
function ISODateString(d){
  function pad(n){return n<10 ? '0'+n : n}
  return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate());
}

function populatescore(_json) {
  $("#game .awayteam").append(_json.data.game.away_team_name);
  $("#game .hometeam").append(_json.data.game.home_team_name);
  $.each(_json.data.game.linescore, function(i, inning) {
      $("#game .awayscore .score" + (i + 1)).append(inning.away_inning_runs);
      $("#game .homescore .score" + (i + 1)).append(inning.home_inning_runs);
      if (i>8) {
          $("#game .boxheader").append("<td class='inning'>" + (i+1) + "</td>");
          $("#game .awayscore").append("<td class='score" + (i+1) + "'>" + inning.away_inning_runs + "</td>");
          $("#game .homescore").append("<td class='score" + (i+1) + "'>" + inning.home_inning_runs + "</td>");
      }
  });
  $("#game .awayscore").append("<td class='awayruns'>" + _json.data.game.away_team_runs + "</td>");
  $("#game .homescore").append("<td class='homeruns'>" + _json.data.game.home_team_runs + "</td>");

  if (_json.data.game.home_team_name === 'Giants') {
    giantsRuns = _json.data.game.home_team_runs;
    opponentRuns = _json.data.game.away_team_runs;
    $("#game .homeruns").addClass("giants");
    $("#game .awayruns").addClass("opponent");
  }
  else {
    giantsRuns = _json.data.game.away_team_runs;
    opponentRuns = _json.data.game.home_team_runs;
    $("#game .homeruns").addClass("opponent");
    $("#game .awayruns").addClass("giants");
  }

  if (parseInt(giantsRuns, 10) < parseInt(opponentRuns, 10)) result = 'lost';
  else if (parseInt(giantsRuns, 10) === parseInt(opponentRuns, 10)) result = 'tied'; //this can only happen in spring training

  if (_json.data.game.status === 'Final') {
    gameFinished = true;
    $("#game .boxheader").append("<td class='inning'>F</td>");
    $("#game .summary").text("The Giants played the " + opponent + " at ");
    $("#game .location").text(todaysGame.location);
    $("#game .tstart").remove();
    $("#game .location").append(' and ' + result + '.');
  }
  else {
    $("#game .boxheader").append("<td class='inning'>R</td>");
  }
  $('.boxscore').show();
}

function make_y_url(_url) {
  var _y_prefix = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D'";
  var _encoded = encodeURIComponent(_url);
  var _y_url = _y_prefix + _encoded + "'&format=json&diagnostics=true&callback=?";
  return _y_url;
}

function getLinescoreLink(gridLink) {
  var giantsLinescoreURL = gridLink.split('grid.json')[0];
    $.getJSON(gridLink, function findGiantsScoreLinkFromGames(json) {
  })
  .done(function getLinscoreFromLink(json) {
    $.each(json.data.games.game, function searchForGiantsGame(i, game) {
      if (game.away_team_name === 'Giants' || game.home_team_name === 'Giants') {
        giantsLinescoreURL = giantsLinescoreURL + 'gid_' + game.id.replace(/[\/-]/g,"_") + '/linescore.json';
        return false;
      }
    });

    $.getJSON(giantsLinescoreURL, function(json){
    })
    .done(function (json) {
      if (json.data.game.status !== 'Preview') {
        populatescore(json);
      }
    });
  });
}

$(document).ready(function(){
  // Format date as MM/DD/YY
  var curr_date = today.getDate();
  var curr_month = today.getMonth() + 1;
  var curr_year = today.getFullYear();

  // Check for game today
  $.getJSON(url,function(data){
    var nextGameDate;

    $.each(data.games,function(i,game){
      nextGameDate = new Date(game.date);
      if (!nextGame && isDateLaterThan(nextGameDate, today)) {
        nextGame = game;
        opponent = nextGame.opponent;
        return false;
      }
      if (today.getYear() == nextGameDate.getYear() && today.getMonth() == nextGameDate.getMonth() && today.getDate() == nextGameDate.getDate()) {
        todaysGame = game;
        opponent = todaysGame.opponent;
        return false;
      }
    });

    if (todaysGame) {
      var gridLink;
      if (curr_month < 10) {
        gridLink = linescore_url_root + 'month_0';

        if (curr_date < 10) {
          gridLink = gridLink + curr_month + "/day_0" + curr_date + "/" + 'grid.json';
        }
        else {
          gridLink = gridLink + curr_month + "/day_" + curr_date + "/" + 'grid.json';
        }
      }
      else {
        if (curr_date < 10)
        {
          gridLink = gridLink + curr_month + "/day_0" + curr_date + "/" + 'grid.json';
        }
        else {
          gridLink = gridLink + curr_month + "/day_" + curr_date + "/" + 'grid.json';
        }
      }
      getLinescoreLink(gridLink);

      $(".fill-in").text("YES");
      $("#game .summary").text("The Giants play the " + opponent + " at ");
      $("#game .location").text(" at " + todaysGame.location);
      $("#game .tstart").text(todaysGame.time);

      $("#game abbr").attr('title', ISODateString(nextGameDate));
      if (todaysGame.location == "AT&T Park") {
          $("body").addClass("home");
          $("#yesno .homeaway").text("At home");
       }
       else {
          $("body").addClass("away");
          $("#yesno .homeaway").text("Away");
       }
      $("#game").show();
    }
    else {
      $(".fill-in").text("NO");
      $("#game .date").text(nextGame.date);
      $("#game .summary").text("The Giants will play the " + opponent + " at ");
      $("#game .location").text(" at " + nextGame.location);

      // Formate next game date as day of the week
      var weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      var nextGameDay = weekday[nextGameDate.getDay()];
      // Format next game date as day of the week

      $("#game .day").text("on " + nextGameDay);
      $("#game .tstart").text(nextGame.time);
      // if (nextGame.location == "AT&T Park") {
      //  $("#nextgame .location").addClass("homegame");
      //   $("body").addClass("homegame-bg");
      // }
      $("#game").show();
    }
  });
  // automatically reload the page once per day
  setTimeout('refreshPage()', 864000000);
});
