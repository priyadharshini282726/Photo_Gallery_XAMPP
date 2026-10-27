PHOTO GALLERY - XAMPP + NODE.JS + MYSQL

Requirements:
1. XAMPP
2. Node.js

Project uses:
- HTML/CSS
- JavaScript
- Node.js
- Express.js
- MySQL
- XAMPP (for MySQL)

SETUP:

1. Copy the "photo_gallery_xampp" folder into:
   C:\xampp\htdocs\

2. Open XAMPP Control Panel.

3. Start MySQL.
   Apache is NOT required because Node.js/Express serves the website.

4. Open phpMyAdmin:
   http://localhost/phpmyadmin

5. Import database.sql.
   This creates the "photo_gallery" database and tables.

6. Open Command Prompt in the project folder:
   cd C:\xampp\htdocs\photo_gallery_xampp

7. Install packages:
   npm install

8. Start the server:
   npm start

9. Open:
   http://localhost:3000

FEATURES:
- Upload photos
- View photos
- Delete photos
- Create albums
- Filter photos by album
- Store photo information in MySQL
- Store uploaded image files in the uploads folder

DEFAULT MYSQL SETTINGS:
Host: localhost
User: root
Password: empty
Database: photo_gallery

If your XAMPP MySQL root account has a password, edit the password
inside server.js.
