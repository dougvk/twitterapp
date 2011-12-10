$(document).ready(function() {
  var twitter_api = "http://api.twitter.com/1";
  var num_following = 0;
  var show_per_page = 20;
  var num_pages = 0;
  var navigation_html = "";
  var current_link = 0;

  request = $.ajax({
    url: twitter_api + "/friends/ids.json?cursor=-1&user_id=" + $('#twitter_id').val(),
    dataType: "jsonp",
    success: function(data) {
      var user_ids = "";
      num_following = data.ids.length;
      num_pages = Math.ceil(num_following/show_per_page);
      $('#current_page').val(0);
      $('#show_per_page').val(show_per_page);

      navigation_html = '<a class="previous_link" href="javascript:previous();">Previous Page</a>';
      while (num_pages > current_link) {
        navigation_html += '<a class="page_link" href="javascript:go_to_page(' + current_link +')" longdesc="' + current_link +'">'+ (current_link + 1) +'</a>';
        current_link++
      }
      navigation_html += '<a class="next_link" href="javascript:next();">Next Page</a>';
      $('#page_navigation').html(navigation_html);
      $('#page_navigation .page_link:first').addClass('active_page');

      $.each(data.ids, function(index, val) {
        user_ids += val + ",";
      });

      user_ids = user_ids.substring(0, user_ids.length-1)
      request_2 = $.ajax({
        url: twitter_api + "/users/lookup.json?user_id=" + user_ids,
        dataType: "jsonp",
        success: function(data) {
          var items = [];

          $.each(data, function(index, value) {
            items.push('<p>' + value.screen_name + '</p>');
          });

          $('div#friends').html(items.join('\n'));
          $('div#friends').children().css('display', 'none');
          $('div#friends').children().slice(0,show_per_page).css('display', 'block');
        }
      });
    }
  });
});

function go_to_page(page_num) {
  var show_per_page = parseInt($('#show_per_page').val());
  start_from = page_num * show_per_page;
  end_on = start_from + show_per_page;

  $('div#friends').children().css('display', 'none').slice(start_from, end_on).css('display', 'block');
  $('.page_link[longdesc=' + page_num +']').addClass('active_page').siblings('.active_page').removeClass('active_page');
  $('#current_page').val(page_num);
}

function previous() {
  new_page = parseInt($('#current_page').val()) - 1;
  if($('.active_page').prev('.page_link').length==true) {
    go_to_page(new_page);
  }
}

function next() {
  new_page = parseInt($('#current_page').val()) + 1;
  if($('.active_page').next('.page_link').length==true) {
    go_to_page(new_page);
  }
}
