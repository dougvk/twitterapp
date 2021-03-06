$(document).ready(function() {
  // helper variables for setting up buttons and pagination
  var twitter_api = "http://api.twitter.com/1";
  var num_following = 0;
  var show_per_page = 20;
  var num_pages = 0;
  var navigation_html = "";
  var current_link = 0;
  var _selectIndex = 0;

  // hide and pad proper elements
  $('body').css('padding-top', '40px');
  $('.loading').hide();

  // if save is clicked, show loading gif and tell my app to unfollow/follow these fools
  $('#save').click(function(event) {
    unfollow = get_unfollowers();
    follow = get_followers();
      //console.log("unfollowing these: " + unfollow);
      //console.log("following these: " + follow);

    $('.span9').hide();
    $('.span7').hide();
    $('.loading').show();

    $.ajax({
      url: "/users/submit",
      data: {
        unfollow: unfollow,
        follow: follow
      },
      success: function(data) {
        location.reload(true);
      },
    });
  });

  // if user hits enter, start ajax call to api
  $('#search').keypress(function(event) {
    if (event.which === 13) {
      event.preventDefault();

      var $query = $('#search');

      if ($query.val() === '') {
        return false;
      }

      // call search with URL encoded query parameter from form
      $.ajax({
        url: twitter_api + "/search.json",
        dataType: "jsonp",
        data: {
          q: $query.val(),
        },
        success: function(data) {
          var results = new Array();

          // create a follow/unfollow button for each result
          $.each(data.results, function(index, value) {
            button = create_button(index, value.from_user, "srchbtn", "search btn danger", "&cross; Not Following");
            results.push(button);
          });

          // add follow/unfollow click events
          $('#results').html(results.join(''));
          $('.search').click(function(event) {
            id = $(this).attr('id');
            type = $(this).attr('class');
            if (type === "search btn success") {
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

   //call this ajax request on page load to get followed users from API
  $.ajax({
    url: twitter_api + "/friends/ids.json",
    dataType: "jsonp",
    data: {
      cursor: "-1",
      user_id: $('#twitter_id').val()
    },
    success: function(data) {
      // on return, figure out how many pages of friends to make
      var user_ids = "";
      num_following = data.ids.length;
      num_pages = Math.ceil(num_following/show_per_page);
      $('#current_page').val(0);
      $('#show_per_page').val(show_per_page);
      $('#num_pages').val(num_pages);

      // create the previous page link
      navigation_html = '<li class="prev disabled"><a href="javascript:previous();">&larr; Previous</a></li>';

      while (num_pages > current_link) {
        // create click handlers for the pagination links
        navigation_html += '<li id="page' + current_link + '"><a href="javascript:go_to_page(' + current_link +');">'+ (current_link + 1) +'</a></li>';
        $('#page'+current_link).click(function() {
          $('.pagination ul li.active').removeClass('active');
          $(this).parent().addClass('active');
        });
        current_link++
      }

      //create the next page link, set page 1 to active
      navigation_html += '<li class="next"><a href="javascript:next();">Next &rarr;</a></li>';
      $('.pagination ul').append(navigation_html);
      $('.pagination ul li:first').next().addClass('active');

      // parse the ids, get the usernames with a second API call
      $.each(data.ids, function(index, val) {
        user_ids += val + ",";
      });


      // since API will only take requests of 100 users at a time, chunk api calls every 100 users
      ids = user_ids.substring(0, user_ids.length-1);
      user_ids = ids.split(',');
      var i, j, temparray, chunk = 100;
      for (i = 0, j = user_ids.length; i < j; i+=chunk) {
          temparray = user_ids.slice(i, i+chunk);
          temparray = temparray.join(',');
          //console.log("Temp array: " + temparray);

          // call for each 100 users
          request_2 = $.ajax({
            url: twitter_api + "/users/lookup.json",
            dataType: "jsonp",
            data: {
              user_id: temparray
            },
            success: function(data) {
              
              // create the follow/unfollow buttons for the returned users
              $.each(data, function(index, value) {
                button = create_button(_selectIndex++, value.screen_name, "btn", "follow btn success", "&check; Following");
                $('#friends').append(button);
                //console.log("Creating button: " + button);
              });

              // show only the first show_per_page
              $('.follow').parent().parent().hide();

              // when all are loaded, add click events and show first show_per_page
              if ($('.follow').parent().parent().length == num_following) {

                  // create click handlers for follow/unfollow actions
                  $('.follow').click(function(event) {
                    id = $(this).attr('id');
                    type = $(this).attr('class');
                    if (type === "follow btn success") {
                      unfollow(id);
                    } else {
                      follow(id);
                    }
                  });

                  $('.follow').parent().parent().slice(0,show_per_page).show();
              }
            }
          });
      }
    }
  });
});

// handles the navigation pane
function go_to_page(page_num) {
  //console.log("calling gotopage");
  var show_per_page = parseInt($('#show_per_page').val());
  var num_pages = parseInt($('#num_pages').val());
  start_from = page_num * show_per_page;
  end_on = start_from + show_per_page;

  // set the correct page to active, disable previous one
  $('.pagination ul li.active').removeClass('active');
  $('#page'+page_num).addClass('active');

  // show the correct 20
  $('.follow').parent().parent().hide();
  $('.follow').parent().parent().slice(start_from, end_on).show();
  //$('.search').parent().parent().show();
  $('#current_page').val(page_num);

  // conditionals to disable/enable next and prev page links
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

// previous page
function previous() {
  //console.log("calling previous");
  new_page = parseInt($('#current_page').val()) - 1;
  if($('.pagination ul li.active').prev().children().text() !== "← Previous") {
    go_to_page(new_page);
  }
}

// next page
function next() {
  //console.log("calling next");
  new_page = parseInt($('#current_page').val()) + 1;
  if($('.pagination ul li.active').next().children().text() !== "Next →") {
    go_to_page(new_page);
  }
}

// unfollow clicked, set to follow
function unfollow(id){
  //console.log("unfollow " + id);
  $('.btn#' + id).removeClass("success");
  $('.btn#' + id).addClass("danger");
  $('.btn#' + id).html("&cross; Not Following");
}

// follow clicked, set to unfollow
function follow(id) {
  //console.log("follow " + id)
  $('.btn#' + id).removeClass("danger");
  $('.btn#' + id).addClass("success");
  $('.btn#' + id).html("&check; Following");
}

function create_button(index, username, id, classname, text) {
  actual_id = "" + id + index;
  //console.log(actual_id);
  button = '<tr><td><span id="' + actual_id + '" class="label notice">@' + username + '</span></td><td><button id="' + actual_id + '" class="' + classname + '">' + text + '</button></td></tr>';
  return button;
}

// parse out twitter handles
function get_unfollowers()
{
  unfollow = [];
  $('.follow.danger').each(function() {
    id = $(this).attr('id');
    //console.log($('.label.notice#'+id).text().substring(1));
    unfollow.push($('.label.notice#'+id).text().substring(1));
  });
  return unfollow.join(',');
}

// parse out twitter handles
function get_followers()
{
  follow = [];
  $('.search.success').each(function() {
    id = $(this).attr('id');
    //console.log($('.label.notice#'+id).text().substring(1));
    follow.push($('.label.notice#'+id).text().substring(1));
  });
  return follow.join(',');
}
