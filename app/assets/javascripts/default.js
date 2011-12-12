$(document).ready(function() {
  var twitter_api = "http://api.twitter.com/1";
  var num_following = 0;
  var show_per_page = 20;
  var num_pages = 0;
  var navigation_html = "";
  var current_link = 0;

  $('body').css('padding-top', '40px');

  $('#search').keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();

      var $query = $('#search');

      if ($query.val() == '') {
        return false;
      }

      request = $.ajax({
        url: twitter_api + "/search.json",
        dataType: "jsonp",
        data: {
          q: $query.val(),
        },
        success: function(data) {
          var items = [];

          $.each(data.results, function(index, value) {
            items.push('<tr><td><span class="label notice">@' + value.from_user + '</span></td><td><button id="srchbtn' + index + '" class="follow btn search danger">&cross; Not Following</button></td></tr>');
          });

          $('#results').html(items.join(''));
          $('.search').click(function(event) {
            id = $(this).attr('id');
            type = $(this).attr('class');
            if (type === "follow btn search success") {
              unfollow(id);
            } else {
              follow(id);
            }
          });
        }
      });

        $('form').submit(function(event) {
          event.preventDefault();
        });
    }
  });

  request = $.ajax({
    url: twitter_api + "/friends/ids.json",
    dataType: "jsonp",
    data: {
      cursor: "-1",
      user_id: $('#twitter_id').val()
    },
    success: function(data) {
      var user_ids = "";
      num_following = data.ids.length;
      num_pages = Math.ceil(num_following/show_per_page);
      $('#current_page').val(0);
      $('#show_per_page').val(show_per_page);
      $('#num_pages').val(num_pages);

      navigation_html = '<li class="prev disabled"><a href="javascript:previous();">&larr; Previous</a></li>';
      while (num_pages > current_link) {
        navigation_html += '<li id="page' + current_link + '"><a href="javascript:go_to_page(' + current_link +');">'+ (current_link + 1) +'</a></li>';
        $('#page'+current_link).click(function() {
          $('.pagination ul li.active').removeClass('active');
          $(this).parent().addClass('active');
        });
        current_link++
      }
      navigation_html += '<li class="next"><a href="javascript:next();">Next &rarr;</a></li>';
      $('.pagination ul').append(navigation_html);
      $('.pagination ul li:first').next().addClass('active');

      $.each(data.ids, function(index, val) {
        user_ids += val + ",";
      });

      user_ids = user_ids.substring(0, user_ids.length-1)
      request_2 = $.ajax({
        url: twitter_api + "/users/lookup.json",
        dataType: "jsonp",
        data: {
          user_id: user_ids
        },
        success: function(data) {
          var items = [];

          $.each(data, function(index, value) {
            items.push('<tr><td><span class="label notice">@' + value.screen_name + '</span></td><td><button id="btn' + index + '" class="follow btn success">&check; Following</button></td></tr>');
          });

          $('#friends').html(items.join(''));
          $('.follow').click(function(event) {
            id = $(this).attr('id');
            type = $(this).attr('class');
            if (type === "follow btn success") {
              unfollow(id);
            } else {
              follow(id);
            }
          });
          $('.follow').parent().parent().hide();
          $('.follow').parent().parent().slice(0,show_per_page).show();
        }
      });
    }
  });
});

function go_to_page(page_num) {
  console.log("calling gotopage");
  var show_per_page = parseInt($('#show_per_page').val());
  var num_pages = parseInt($('#num_pages').val());
  start_from = page_num * show_per_page;
  end_on = start_from + show_per_page;

  $('.pagination ul li.active').removeClass('active');
  $('#page'+page_num).addClass('active');

  $('.follow').parent().parent().hide();
  $('.follow').parent().parent().slice(start_from, end_on).show();
  $('.search').parent().parent().show();
  $('#current_page').val(page_num);

  if (page_num > 0) {
    $('.pagination ul li:first').removeClass('prev disabled');
    $('.pagination ul li:first').addClass('prev');
  }

  if (page_num == 0)
    $('.pagination ul li:first').addClass('prev disabled');

  if (page_num+1 < num_pages) {
    $('.pagination ul li:last').removeClass('next disabled');
    $('.pagination ul li:last').addClass('next');
  }

  if (page_num+1 === num_pages)
    $('.pagination ul li:last').addClass('next disabled');
}

function previous() {
  console.log("calling previous");
  new_page = parseInt($('#current_page').val()) - 1;
  if($('.pagination ul li.active').prev().children().text().length === 1) {
    go_to_page(new_page);
  }
}

function next() {
  console.log("calling next");
  new_page = parseInt($('#current_page').val()) + 1;
  if($('.pagination ul li.active').next().children().text().length === 1) {
    go_to_page(new_page);
  }
}

function unfollow(id){
  console.log("unfollow " + id);
  $('#' + id).removeClass("success");
  $('#' + id).addClass("danger");
  $('#' + id).html("&cross; Not Following");
}

function follow(id) {
  console.log("follow " + id)
  $('#' + id).removeClass("danger");
  $('#' + id).addClass("success");
  $('#' + id).html("&check; Following");
}
