const PROJECT_DATA_PATH = "../../data/projects.json";

async function loadProjectMeta() {
  const body = document.body;
  const projectSlug = body.dataset.projectSlug;

  const titleEl = document.getElementById("project-title");
  const descriptionEl = document.getElementById("project-description");
  const longDescriptionEl = document.getElementById("project-long-description");
  const tagsEl = document.getElementById("project-tags");
  const controlsEl = document.getElementById("project-controls");
  const notesEl = document.getElementById("project-notes");
  const statusEl = document.getElementById("project-status");
  const overlayTitleEl = document.getElementById("overlay-title");

  if (!projectSlug) {
    console.error("Missing data-project-slug on <body>");
    applyProjectMetaError({
      titleEl,
      descriptionEl,
      longDescriptionEl,
      tagsEl,
      controlsEl,
      notesEl,
      statusEl,
      overlayTitleEl
    }, "Missing project slug.");
    return null;
  }

  try {
    const response = await fetch(PROJECT_DATA_PATH, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load projects.json (${response.status})`);
    }

    const projects = await response.json();

    if (!Array.isArray(projects)) {
      throw new Error("projects.json is not an array.");
    }

    const project = projects.find((item) => item.slug === projectSlug);

    if (!project) {
      throw new Error(`Project slug "${projectSlug}" not found.`);
    }

    applyProjectMeta({
      project,
      titleEl,
      descriptionEl,
      longDescriptionEl,
      tagsEl,
      controlsEl,
      notesEl,
      statusEl,
      overlayTitleEl
    });

    return project;
  } catch (error) {
    console.error(error);
    applyProjectMetaError({
      titleEl,
      descriptionEl,
      longDescriptionEl,
      tagsEl,
      controlsEl,
      notesEl,
      statusEl,
      overlayTitleEl
    }, error.message);

    return null;
  }
}

function applyProjectMeta(elements) {
  const {
    project,
    titleEl,
    descriptionEl,
    longDescriptionEl,
    tagsEl,
    controlsEl,
    notesEl,
    statusEl,
    overlayTitleEl
  } = elements;

  const title = project.title || "Untitled Project";
  const description = project.description || "No description provided.";
  const longDescription = project.longDescription || description;
  const status = project.status || "unknown";

  document.title = title;

  if (titleEl) titleEl.textContent = title;
  if (descriptionEl) descriptionEl.textContent = description;
  if (longDescriptionEl) longDescriptionEl.textContent = longDescription;
  if (statusEl) statusEl.textContent = status;
  if (overlayTitleEl) overlayTitleEl.textContent = title;

  if (tagsEl) renderTagList(tagsEl, project.tags || []);
  if (controlsEl) renderBulletList(controlsEl, project.controls || ["No controls listed."]);
  if (notesEl) renderBulletList(notesEl, project.notes || ["No notes provided."]);
}

function applyProjectMetaError(elements, message) {
  const {
    titleEl,
    descriptionEl,
    longDescriptionEl,
    tagsEl,
    controlsEl,
    notesEl,
    statusEl,
    overlayTitleEl
  } = elements;

  if (titleEl) titleEl.textContent = "Project metadata error";
  if (descriptionEl) descriptionEl.textContent = "Could not load project metadata.";
  if (longDescriptionEl) longDescriptionEl.textContent = message || "Unknown metadata error.";
  if (statusEl) statusEl.textContent = "metadata error";
  if (overlayTitleEl) overlayTitleEl.textContent = "Project error";

  if (tagsEl) {
    tagsEl.innerHTML = "";
    renderTagList(tagsEl, ["error"]);
  }

  if (controlsEl) {
    controlsEl.innerHTML = "";
    renderBulletList(controlsEl, ["Check the browser console for details."]);
  }

  if (notesEl) {
    notesEl.innerHTML = "";
    renderBulletList(notesEl, ["Make sure the slug matches projects.json and you are using a local server."]);
  }
}

function renderTagList(container, tags) {
  container.innerHTML = "";

  if (!Array.isArray(tags) || tags.length === 0) {
    const tag = document.createElement("span");
    tag.className = "sidebar-tag";
    tag.textContent = "untagged";
    container.appendChild(tag);
    return;
  }

  for (const tagText of tags) {
    const tag = document.createElement("span");
    tag.className = "sidebar-tag";
    tag.textContent = tagText;
    container.appendChild(tag);
  }
}

function renderBulletList(container, items) {
  container.innerHTML = "";

  for (const itemText of items) {
    const li = document.createElement("li");
    li.textContent = itemText;
    container.appendChild(li);
  }
}

window.loadProjectMeta = loadProjectMeta;