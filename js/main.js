const projectsGrid = document.getElementById("projects-grid");
const projectCount = document.getElementById("project-count");
const template = document.getElementById("project-card-template");
const tagFilters = document.getElementById("tag-filters");

let allProjects = [];
let activeTag = "all";

async function loadProjects() {
  try {
    const response = await fetch("./data/projects.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load projects.json (${response.status})`);
    }

    const projects = await response.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      projectCount.textContent = "No projects found yet.";
      projectsGrid.innerHTML = "<p>No projects available.</p>";
      return;
    }

    allProjects = [...projects].sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : 999999;
      const orderB = Number.isFinite(b.order) ? b.order : 999999;
      return orderA - orderB;
    });

    renderTagFilters(allProjects);
    renderProjects(allProjects);
  } catch (error) {
    console.error(error);
    projectCount.textContent = "Could not load projects.";
    projectsGrid.innerHTML = `
      <p>
        Could not load project data. If you are opening this directly as a file,
        run it through a local server instead.
      </p>
    `;
  }
}

function renderTagFilters(projects) {
  const tagSet = new Set();

  for (const project of projects) {
    if (Array.isArray(project.tags)) {
      for (const tag of project.tags) {
        tagSet.add(tag);
      }
    }
  }

  const tags = ["all", ...Array.from(tagSet).sort()];
  tagFilters.innerHTML = "";

  for (const tag of tags) {
    const button = document.createElement("button");
    button.className = "tag-filter-btn";
    if (tag === activeTag) button.classList.add("active");

    button.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);

    button.addEventListener("click", () => {
      activeTag = tag;
      updateActiveFilterButton();
      filterProjects();
    });

    tagFilters.appendChild(button);
  }
}

function updateActiveFilterButton() {
  const buttons = tagFilters.querySelectorAll(".tag-filter-btn");

  buttons.forEach((button) => {
    const label = button.textContent.toLowerCase();
    button.classList.toggle("active", label === activeTag);
  });
}

function filterProjects() {
  if (activeTag === "all") {
    renderProjects(allProjects);
    return;
  }

  const filtered = allProjects.filter((project) =>
    Array.isArray(project.tags) && project.tags.includes(activeTag)
  );

  renderProjects(filtered);
}

function renderProjects(projects) {
  projectsGrid.innerHTML = "";
  projectCount.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;

  for (const project of projects) {
    const node = template.content.cloneNode(true);

    const card = node.querySelector(".project-card");
    const thumb = node.querySelector(".project-thumb");
    const title = node.querySelector(".project-title");
    const desc = node.querySelector(".project-desc");
    const tags = node.querySelector(".project-tags");

    card.href = project.path || "#";

    thumb.src = project.thumbnail || "./assets/thumbnails/placeholder.png";
    thumb.alt = project.title ? `${project.title} thumbnail` : "Project thumbnail";

    title.textContent = project.title || "Untitled Project";
    desc.textContent = project.description || "No description provided.";

    if (Array.isArray(project.tags)) {
      for (const tagText of project.tags) {
        const tag = document.createElement("span");
        tag.className = "project-tag";
        tag.textContent = tagText;
        tags.appendChild(tag);
      }
    }

    projectsGrid.appendChild(node);
  }
}

loadProjects();