from flask import Flask, render_template, request, redirect, url_for, send_from_directory, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask_talisman import Talisman
from flask import send_from_directory, current_app
import bleach
import os
import mimetypes

app = app = Flask(__name__, static_folder='static', template_folder='template')

Talisman(app, content_security_policy={
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'object-src': ['none'],
    'media-src': ['none']

})

	
# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///d://shwetha//pwa//reviews.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key'

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Models
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class MovieReview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_title = db.Column(db.String(100), nullable=False)
    review = db.Column(db.Text, nullable=False)
    reviewer_name = db.Column(db.String(50), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)

        if User.query.filter_by(username=username).first():
            flash('Username already exists!', 'danger')
            return redirect(url_for('register'))

        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            flash("Login successful!", 'success')
            return redirect(url_for('index'))
        else:
            flash("Invalid username or password!", 'error')
    return render_template('login.html')

@app.route('/reviews', methods=['GET', 'POST'])
def get_reviews():
    movie_title = request.args.get('movie_title')  # Get the selected movie title from query string
    if movie_title:
        reviews = MovieReview.query.filter_by(movie_title=movie_title).order_by(MovieReview.date_posted.desc()).all()
    else:
        reviews = MovieReview.query.order_by(MovieReview.date_posted.desc()).all()  # Default to all reviews if no movie is selected

    # Get a list of distinct movie titles for the dropdown
    movie_titles = db.session.query(MovieReview.movie_title).distinct().all()
    movie_titles = [title[0] for title in movie_titles]  # Extracting movie titles from the result

    return render_template('reviews.html', reviews=reviews, movie_titles=movie_titles, selected_movie=movie_title)


@app.route('/add_review', methods=['GET', 'POST'])
@login_required
def add_review():
    movie_title = None
    if request.method == 'POST':
        movie_title = request.form.get('movie_title')  # Get the selected inbuilt movie
        movie_title_input = request.form.get('movie_title_input').strip()  # Get the custom movie title entered by the user

        # If a custom movie title is entered, use that title
        if movie_title_input:
            movie_title = movie_title_input

        # If no movie title is selected or entered, flash an error
        if not movie_title:
            flash("Please select or enter a movie name.", 'danger')
            return redirect(url_for('add_review'))

        review = request.form['review']
        reviewer_name = current_user.username
        rating = int(request.form['rating'])

        # Sanitize the review text
        sanitized_review = bleach.clean(review, tags=['b', 'i', 'u', 'em', 'strong', 'a'])

        # Add the review to the database
        new_review = MovieReview(
            movie_title=movie_title,
            review=sanitized_review,
            reviewer_name=reviewer_name,
            rating=rating
        )
        db.session.add(new_review)
        db.session.commit()

        flash("Review added successfully!", 'success')
        return redirect(url_for('get_reviews'))

    # Fetch distinct movie titles from the database
    movie_titles = db.session.query(MovieReview.movie_title).distinct().all()
    movie_titles = [title[0] for title in movie_titles]  # Extracting movie titles from the result
    return render_template('add_review.html', movie_titles=movie_titles, selected_movie=movie_title)

from flask import render_template, request, redirect, url_for

@app.route('/edit_review/<int:review_id>', methods=['GET', 'POST'])
@login_required
def edit_review(review_id):
    review = MovieReview.query.get_or_404(review_id)  # Fetch the review by ID

    # Check if the current user is the owner of the review
    if review.reviewer_name != current_user.username:  # Check if the reviewer is the current user
        flash("You are not authorized to edit this review.", 'danger')
        return redirect(url_for('get_reviews'))  # Redirect to reviews page if unauthorized

    if request.method == 'POST':
        review.movie_title = request.form['movie_title']
        review.review = request.form['review']
        review.rating = request.form['rating']
        db.session.commit()  # Commit the changes to the database
        flash("Review updated successfully!", 'success')
        return redirect(url_for('get_reviews'))  # Redirect to the reviews page after edit

    return render_template('edit_review.html', review=review)

@app.route('/delete_review/<int:review_id>', methods=['POST'])
@login_required
def delete_review(review_id):
    review = MovieReview.query.get_or_404(review_id)

    # Check if the current user is the owner of the review
    if review.reviewer_name != current_user.username:  # Check if the reviewer is the current user
        flash("You are not authorized to delete this review.", 'danger')
        return redirect(url_for('get_reviews'))  # Redirect to reviews page if unauthorized

    db.session.delete(review)
    db.session.commit()  # Commit the deletion
    flash("Review deleted successfully.", 'success')
    return redirect(url_for('get_reviews'))  # Redirect to the reviews page after deletion

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('login'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
