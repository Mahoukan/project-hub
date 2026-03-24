**Mega Project Hub**

A collection of interactive experiments, visual projects, and small game prototypes. This is a space to explore ideas, test mechanics, and build things that are fun, interesting, or just worth trying.

**Live Site**

👉 [https://mahoukan.github.io/project-hub/](url)

**About**

This project acts as a central hub for a range of smaller projects, including:

Interactive visuals
Mathematical explorations
Game prototypes
UI and animation experiments

Each project is self-contained but connected through the hub for easy browsing.

**Projects**

Projects are listed dynamically using a JSON file, which makes it easy to add or update content without changing the main layout.

Each project includes:

A thumbnail preview
Short description
Tags for filtering
A dedicated project page
Controls (Example)

Some projects include interactive controls, such as:

Arrow keys → switch between states or variations
H → hide UI
S → open settings
Mouse / touch → interact directly

Controls vary depending on the project.

**Structure**
index.html
css/
  main.css
  project-layout.css
js/
  main.js
data/
  projects.json
images/
  thumbnails/
projects/
  project-name/
    index.html

    
**Adding a New Project**

Create a new folder inside /projects/

Add your project files (usually an index.html)

Add a thumbnail to /images/thumbnails/

Add a new entry in data/projects.json

**Example:**

{
  "title": "My Project",
  "description": "Short description",
  "path": "./projects/my-project/index.html",
  "thumbnail": "images/thumbnails/my-project.png",
  "tags": ["visual", "interactive"]
}

**Tech**

  HTML, CSS, JavaScript
  Canvas-based rendering (p5.js / vanilla canvas)

**License**

Open for personal use and experimentation.
