class UsersController < ApplicationController
  include OauthWrapper

  # apply these functions before every function call (except in the list)
  before_filter :require_oauth, :except => [:callback, :signout, :home, :submit]
  before_filter :instantiate_user, :except => [:callback, :signout, :home]
  before_filter :access_privileges, :except => [:callback, :signout, :home, :submit]

  # just renders the homepage
  def home
  end

  # applies all the filter functions, logs in by oauth
  def new
  end
  
  # called when user submits his follow/unfollow actions
  def submit
    self.oaw_follow(params[:follow])
    self.oaw_unfollow(params[:unfollow])
  end

  # called by twitter after user clicks login by oauth
  def callback
    self.oaw_callback(params[:oauth_verifier], params[:oauth_token])
  end

  # responds with a rendered show.html.erb for signed in user
  def show
    respond_to do |format|
      format.html
      format.xml { render :xml => @user }
    end
  end

  # logs the user out by clearing current user and session
  def signout
    self.oaw_signout
    redirect_to root_url
  end

  # before_filter helper functions
  protected

  def require_oauth
    logged_in? || oaw_login_by_oauth
  end

  def instantiate_user
    begin
      @user = User.find_by_screen_name(params[:id])
      if not @user
        raise "User not found"
      end
    rescue Exception => e
      Rails.logger.error e.message
      redirect_to root_path
      return false
    end
  end

  def access_privileges
    return current_user.id == @user.id
    redirect_to user_path(current_user)
    return false
  end
end
