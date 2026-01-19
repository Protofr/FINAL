// Generic UI component creation functions
function createClaimItLogo(className = '') {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 256 256");
    svg.setAttribute("width", "1em");
    svg.setAttribute("height", "1em");
    if (className) svg.className = className;

    svg.innerHTML = `
        <path fill="none" d="M0 0h256v256H0z" />
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" d="M128 128h88m-176 0h88m-88 56h176" />
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" d="M40 128V72a8 8 0 0 1 8-8h152a8 8 0 0 1 8 8v56m0 56v24a8 8 0 0 1-8-8H48a8 8 0 0 1-8-8v-24" />
        <path d="M100 64a28 28 0 1 1-28-28 28 28 0 0 1 28 28z" fill="currentColor" />
    `;
    return svg;
}

function createButton(text, variant = 'primary', size = 'default', asChild = false, onClick = () => {}, disabled = false, className = '') {
    const btn = document.createElement(asChild ? 'a' : 'button');
    btn.className = `button button-${variant} ${className}`;
    if (size !== 'default') btn.classList.add(`button-${size}`);
    btn.textContent = text;
    btn.disabled = disabled;
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
}

function createCard(title, description, content, footer, className = '') {
    const card = document.createElement('div');
    card.className = `card ${className}`;

    const header = document.createElement('div');
    header.className = 'card-header';
    const titleElem = document.createElement('div');
    titleElem.className = 'card-title';
    titleElem.textContent = title;
    header.appendChild(titleElem);
    if (description) {
        const descElem = document.createElement('div');
        descElem.className = 'card-description';
        descElem.textContent = description;
        header.appendChild(descElem);
    }
    card.appendChild(header);

    const contentElem = document.createElement('div');
    contentElem.className = 'card-content';
    if (typeof content === 'string') {
        contentElem.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        contentElem.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(node => contentElem.appendChild(node));
    }
    card.appendChild(contentElem);

    if (footer) {
        const footerElem = document.createElement('div');
        footerElem.className = 'card-footer';
        if (typeof footer === 'string') {
            footerElem.innerHTML = footer;
        } else if (footer instanceof HTMLElement) {
            footerElem.appendChild(footer);
        } else if (Array.isArray(footer)) {
            footer.forEach(node => footerElem.appendChild(node));
        }
        card.appendChild(footerElem);
    }

    return card;
}

function createFormGroup(label, inputElement, errorMessage = '') {
    const div = document.createElement('div');
    div.className = 'form-group';

    const labelElem = document.createElement('label');
    labelElem.className = 'form-label';
    labelElem.textContent = label;
    div.appendChild(labelElem);
    div.appendChild(inputElement);

    if (errorMessage) {
        const errorElem = document.createElement('p');
        errorElem.className = 'form-error';
        errorElem.textContent = errorMessage;
        div.appendChild(errorElem);
    }
    return div;
}

function createInput(type, placeholder, name, value = '', className = '') {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.name = name;
    input.value = value;
    input.className = `form-input ${className}`;
    return input;
}

function createTextarea(placeholder, name, value = '', className = '') {
    const textarea = document.createElement('textarea');
    textarea.placeholder = placeholder;
    textarea.name = name;
    textarea.value = value;
    textarea.className = `form-textarea ${className}`;
    return textarea;
}

function createSelect(name, options, defaultValue = '', className = '') {
    const select = document.createElement('select');
    select.name = name;
    select.className = `form-select ${className}`;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a category';
    select.appendChild(defaultOption);

    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        if (optionText === defaultValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    return select;
}

function createBadge(text, variant = 'secondary', className = '') {
    const span = document.createElement('span');
    span.className = `badge badge-${variant} ${className}`;
    span.textContent = text;
    return span;
}

function createSkeleton(width = '100%', height = '1rem', className = '') {
    const div = document.createElement('div');
    div.className = `skeleton ${className}`;
    div.style.width = width;
    div.style.height = height;
    return div;
}

function createAvatar(src, alt, fallbackText, className = '') {
    const div = document.createElement('div');
    div.className = `avatar ${className}`; // Needs specific CSS for avatar shape

    if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.className = 'avatar-image'; // Needs specific CSS
        div.appendChild(img);
    } else if (fallbackText) {
        const span = document.createElement('span');
        span.className = 'avatar-fallback'; // Needs specific CSS
        span.textContent = fallbackText;
        div.appendChild(span);
    }
    return div;
}

function createTabs(tabsData, defaultValue, onTabChange) {
    const container = document.createElement('div');
    container.className = 'tabs-container'; // Custom class for overall tabs

    const tabsList = document.createElement('div');
    tabsList.className = 'tabs-list';
    container.appendChild(tabsList);

    const tabsContentContainer = document.createElement('div');
    tabsContentContainer.className = 'tabs-content-container'; // Custom class for content
    container.appendChild(tabsContentContainer);

    let activeTabValue = defaultValue;

    const renderTabs = () => {
        tabsList.innerHTML = '';
        tabsContentContainer.innerHTML = '';

        tabsData.forEach(tab => {
            const trigger = document.createElement('button');
            trigger.className = `tabs-trigger ${tab.value === activeTabValue ? 'active' : ''}`;
            trigger.textContent = tab.label;
            trigger.addEventListener('click', () => {
                activeTabValue = tab.value;
                onTabChange(tab.value); // Notify parent of tab change
                renderTabs(); // Re-render to update active state
            });
            tabsList.appendChild(trigger);

            const contentDiv = document.createElement('div');
            contentDiv.className = `tabs-content ${tab.value === activeTabValue ? 'active' : 'hidden'}`; // Use 'active' class for styling
            if (typeof tab.content === 'string') {
                contentDiv.innerHTML = tab.content;
            } else if (tab.content instanceof HTMLElement) {
                contentDiv.appendChild(tab.content);
            } else if (Array.isArray(tab.content)) {
                tab.content.forEach(node => contentDiv.appendChild(node));
            }
            tabsContentContainer.appendChild(contentDiv);
        });
    };

    renderTabs(); // Initial render

    return { element: container, setActiveTab: (value) => { activeTabValue = value; renderTabs(); } };
}

// Simple dropdown menu for user profile in header
function createDropdownMenu(triggerElement, items) {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'dropdown-menu-container relative';

    // Ensure triggerElement is a DOM node or convert it
    let finalTriggerElement = triggerElement;
    if (typeof triggerElement === 'string') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = triggerElement;
        finalTriggerElement = tempDiv.firstElementChild;
    }

    if (finalTriggerElement) {
        dropdownContainer.appendChild(finalTriggerElement);
    } else {
        console.error("Dropdown trigger element is invalid.");
        return;
    }

    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'dropdown-menu-content';
    dropdownContent.style.display = 'none'; // Hidden by default
    dropdownContainer.appendChild(dropdownContent);

    items.forEach(item => {
        // Handle special label items vs. clickable items
        if (item.className && (item.className.includes('font-normal') || item.className.includes('text-xs'))) {
             const labelItem = document.createElement('div');
             labelItem.className = `dropdown-menu-item dropdown-menu-label ${item.className || ''}`;
             labelItem.textContent = item.label;
             dropdownContent.appendChild(labelItem);
        } else {
            const menuItem = document.createElement('div');
            menuItem.className = 'dropdown-menu-item';
            menuItem.textContent = item.label;
            if (item.onClick) {
                menuItem.addEventListener('click', item.onClick);
            }
            dropdownContent.appendChild(menuItem);
        }
    });

    finalTriggerElement.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click from closing immediately
        dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
        dropdownContent.style.display = 'none';
    });

    return dropdownContainer;
}

// Helper to remove 'hidden' class from one element and add to others
function manageVisibility(elements, activeElement) {
    elements.forEach(el => {
        if (el === activeElement) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

/* Shared UI helpers */

// Returns consistent innerHTML for Google sign-in buttons used across sign-in and sign-up pages
function getGoogleButtonInnerHTML() {
    return `
        <svg class="mr-2 h-4 w-4" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display:block" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.56 2.1-2.06 3.88-4.38 5.03l7.03 5.45C44.66 37.9 47 31.7 47 24.55z"/>
            <path fill="#FBBC05" d="M10.54 28.96c-.64-1.9-1.01-3.93-1.01-6.01s.37-4.11 1.01-6.01L2.56 11.3C1.15 14.85 0 18.63 0 23c0 4.37 1.15 8.15 2.56 11.7l8-5.74z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.82l-7.43-5.76C30.36 36.68 27.32 37.8 24 37.8 17.46 37.8 11.96 33.47 9.75 27.33l-8 5.74C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span>Google</span>
    `;
}