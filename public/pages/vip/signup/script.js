const form = document.querySelector('[data-multistep-form]');

if (form) {
  const panels = Array.from(form.querySelectorAll('[data-step-panel]'));
  const indicators = Array.from(document.querySelectorAll('[data-step-indicator]'));
  const stepperShell = document.querySelector('.stepper-shell');
  const prevButton = form.querySelector('[data-step-action="prev"]');
  const nextButton = form.querySelector('[data-step-action="next"]');
  const submitButton = form.querySelector('[data-step-action="submit"]');
  const successScreen = document.querySelector('[data-success-screen]');
  const confettiRoot = document.querySelector('[data-confetti]');
  const photoInput = form.querySelector('#photos');
  const previewGrid = form.querySelector('[data-preview-grid]');
  const previewEmpty = form.querySelector('[data-preview-empty]');
  const photoCount = form.querySelector('[data-photo-count]');
  const photoLimit = form.querySelector('[data-photo-limit]');
  const skipPhotosButton = form.querySelector('[data-photo-action="skip"]');
  const maxPhotos = 6;
  const confettiColors = ['#d94f33', '#ffd84d', '#4c8df6', '#f6b14f', '#d970d8', '#f5bccd', '#d27b2d', '#5d6ad8', '#a9d7ee'];
  let selectedPhotos = [];
  let currentStep = 1;

  const updateStepUI = () => {
    panels.forEach((panel, index) => {
      const step = index + 1;
      const isActive = step === currentStep;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });

    indicators.forEach((indicator, index) => {
      const step = index + 1;
      indicator.classList.toggle('is-active', step === currentStep);
      indicator.classList.toggle('is-complete', step < currentStep);
    });

    prevButton.hidden = currentStep === 1;
    nextButton.hidden = currentStep === panels.length;
    submitButton.hidden = currentStep !== panels.length;
  };

  const getStepFields = (step) => {
    const panel = panels[step - 1];
    if (!panel) {
      return [];
    }

    return Array.from(panel.querySelectorAll('input, textarea, select')).filter((field) => !field.disabled);
  };

  const validateStep = (step) => {
    if (step === 2) {
      return true;
    }

    const fields = getStepFields(step);

    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    return true;
  };

  const syncPhotoInput = () => {
    const dataTransfer = new DataTransfer();
    selectedPhotos.forEach((file) => dataTransfer.items.add(file));
    photoInput.files = dataTransfer.files;
  };

  const renderPreviews = () => {
    previewGrid.innerHTML = '';
    photoCount.textContent = `已上传 ${selectedPhotos.length} / ${maxPhotos}`;
    photoLimit.hidden = selectedPhotos.length < maxPhotos;

    if (selectedPhotos.length === 0) {
      previewEmpty.hidden = false;
      return;
    }

    previewEmpty.hidden = true;

    selectedPhotos.forEach((file, index) => {
      const card = document.createElement('figure');
      card.className = 'preview-card';

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'preview-remove';
      removeButton.textContent = '×';
      removeButton.setAttribute('aria-label', `移除 ${file.name}`);
      removeButton.addEventListener('click', () => {
        selectedPhotos = selectedPhotos.filter((_, fileIndex) => fileIndex !== index);
        syncPhotoInput();
        renderPreviews();
      });

      const image = document.createElement('img');
      image.className = 'preview-image';
      image.alt = file.name;
      image.src = URL.createObjectURL(file);
      image.onload = () => URL.revokeObjectURL(image.src);

      const meta = document.createElement('figcaption');
      meta.className = 'preview-meta';
      meta.textContent = file.name;

      card.append(removeButton, image, meta);
      previewGrid.append(card);
    });
  };

  const launchConfetti = () => {
    confettiRoot.innerHTML = '';

    for (let index = 0; index < 22; index += 1) {
      const piece = document.createElement('span');
      const width = 8 + Math.round(Math.random() * 8);
      const height = 14 + Math.round(Math.random() * 20);
      const left = Math.round(Math.random() * 92);
      const delay = Math.round(Math.random() * 420);
      const duration = 1400 + Math.round(Math.random() * 900);
      const drift = -36 + Math.round(Math.random() * 72);
      const rotateStart = -80 + Math.round(Math.random() * 160);
      const rotateEnd = rotateStart + 160 + Math.round(Math.random() * 260);
      const color = confettiColors[index % confettiColors.length];

      piece.className = 'confetti-piece';
      piece.style.left = `${left}%`;
      piece.style.width = `${width}px`;
      piece.style.height = `${height}px`;
      piece.style.background = color;
      piece.style.animationDelay = `${delay}ms`;
      piece.style.animationDuration = `${duration}ms`;
      piece.style.setProperty('--confetti-drift', `${drift}px`);
      piece.style.setProperty('--confetti-rotate-start', `${rotateStart}deg`);
      piece.style.setProperty('--confetti-rotate-end', `${rotateEnd}deg`);

      confettiRoot.append(piece);
    }
  };

  prevButton.addEventListener('click', () => {
    currentStep = Math.max(1, currentStep - 1);
    updateStepUI();
  });

  nextButton.addEventListener('click', () => {
    if (!validateStep(currentStep)) {
      return;
    }

    currentStep = Math.min(panels.length, currentStep + 1);
    updateStepUI();
  });

  photoInput.addEventListener('change', () => {
    const [file] = Array.from(photoInput.files || []);

    if (!file) {
      return;
    }

    if (selectedPhotos.length >= maxPhotos) {
      photoLimit.hidden = false;
      photoInput.value = '';
      return;
    }

    selectedPhotos = [...selectedPhotos, file].slice(0, maxPhotos);
    syncPhotoInput();
    renderPreviews();
  });

  skipPhotosButton.addEventListener('click', () => {
    currentStep = Math.min(panels.length, 3);
    updateStepUI();
  });

  form.addEventListener('submit', (event) => {
    if (!validateStep(currentStep)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    form.hidden = true;
    stepperShell.hidden = true;
    successScreen.hidden = false;
    launchConfetti();
  });

  syncPhotoInput();
  updateStepUI();
  renderPreviews();
}
