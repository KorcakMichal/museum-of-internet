import { worldBounds } from '../config';

export function makeButton(label, onClick, variant = 'button-secondary') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button ${variant}`;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

export function makeLink(label, href, variant = 'button-secondary') {
  const link = document.createElement('a');
  link.className = `button ${variant}`;
  link.href = href;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = label;
  return link;
}

export function makeCard({ title, description, meta, hero = false, actions = [] }) {
  const card = document.createElement('article');
  card.className = `web-card${hero ? ' hero' : ''}`;

  const heading = document.createElement('h3');
  heading.textContent = title;
  card.appendChild(heading);

  if (meta) {
    const metaLine = document.createElement('div');
    metaLine.className = 'web-card-meta';
    metaLine.textContent = meta;
    card.appendChild(metaLine);
  }

  if (description) {
    const text = document.createElement('p');
    text.textContent = description;
    card.appendChild(text);
  }

  if (actions.length > 0) {
    const actionRow = document.createElement('div');
    actionRow.className = 'web-card-actions';
    actions.forEach((action) => actionRow.appendChild(action));
    card.appendChild(actionRow);
  }

  return card;
}

export function toMapPercent(x, y) {
  return {
    x: (x / worldBounds.width) * 100,
    y: (y / worldBounds.height) * 100,
  };
}

export function clearElement(element) {
  element.innerHTML = '';
}
