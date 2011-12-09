class UsersController < ApplicationController
  include OauthWrapper

  before_filter :require_oauth, :except => [:callback, :signout, :home]
  before_filter :instantiate_user, :except => [:callback, :signout, :home]
  before_filter :access_privileges, :except => [:callback, :signout, :home]

  def home
  end

  def new
  end

  def callback
    #TODO: check for verification
    oaw_callback(params[:oauth_verifier], params[:oauth_token])
  end

  def show
    respond_to do |format|
      format.html
      format.xml { render :xml => @user }
    end
  end

  def signout
    oaw_signout
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
    rescue
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
