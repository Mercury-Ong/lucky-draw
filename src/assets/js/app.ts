import confetti from 'canvas-confetti';
import Slot from '@js/Slot';
import SoundEffects from '@js/SoundEffects';

// Initialize slot machine
(() => {
  const drawButton = document.getElementById('draw-button') as HTMLButtonElement | null;
  const fullscreenButton = document.getElementById('fullscreen-button') as HTMLButtonElement | null;
  const settingsButton = document.getElementById('settings-button') as HTMLButtonElement | null;
  const settingsWrapper = document.getElementById('settings') as HTMLDivElement | null;
  const settingsContent = document.getElementById('settings-panel') as HTMLDivElement | null;
  const settingsSaveButton = document.getElementById('settings-save') as HTMLButtonElement | null;
  const settingsCloseButton = document.getElementById('settings-close') as HTMLButtonElement | null;
  const giftSettingsButton = document.getElementById('gift-settings-button') as HTMLButtonElement | null;
  const giftSettingsWrapper = document.getElementById('gift-settings') as HTMLDivElement | null;
  const giftSettingsContent = document.getElementById('gift-settings-panel') as HTMLDivElement | null;
  const giftSettingsSaveButton = document.getElementById('gift-settings-save') as HTMLButtonElement | null;
  const giftSettingsCloseButton = document.getElementById('gift-settings-close') as HTMLButtonElement | null;
  const sunburstSvg = document.getElementById('sunburst') as HTMLImageElement | null;
  const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  const nameListTextArea = document.getElementById('name-list') as HTMLTextAreaElement | null;
  const priorityNameListTextArea = document.getElementById('priority-name-list') as HTMLTextAreaElement | null;
  const removeNameFromListCheckbox = document.getElementById('remove-from-list') as HTMLInputElement | null;
  const enableSoundCheckbox = document.getElementById('enable-sound') as HTMLInputElement | null;
  const volumeControl = document.getElementById('volume-control') as HTMLInputElement | null;
  const imageUpload = document.getElementById('image-upload') as HTMLInputElement | null;
  const uploadedImage = document.getElementById('uploaded-image') as HTMLImageElement | null;
  const giftListContainer = document.getElementById('gift-list') as HTMLDivElement | null;
  const imageBox = document.getElementById('image-box') as HTMLDivElement | null;
  const imageNavLeft = document.getElementById('image-nav-left') as HTMLDivElement | null;
  const imageNavRight = document.getElementById('image-nav-right') as HTMLDivElement | null;
  const giftNameDisplay = document.getElementById('gift-name') as HTMLHeadingElement | null;
  const spinCounter = document.getElementById('spin-counter') as HTMLHeadingElement | null;

  // Graceful exit if necessary elements are not found
  if (!(
    drawButton
    && fullscreenButton
    && settingsButton
    && settingsWrapper
    && settingsContent
    && settingsSaveButton
    && settingsCloseButton
    && giftSettingsButton
    && giftSettingsWrapper
    && giftSettingsContent
    && giftSettingsSaveButton
    && giftSettingsCloseButton
    && sunburstSvg
    && confettiCanvas
    && nameListTextArea
    && priorityNameListTextArea
    && removeNameFromListCheckbox
    && enableSoundCheckbox
    && volumeControl
    && imageUpload
    && uploadedImage
    && giftListContainer
    && imageBox
    && imageNavLeft
    && imageNavRight
    && giftNameDisplay
    && spinCounter
  )) {
    console.error('One or more Element ID is invalid. This is possibly a bug.');
    return;
  }

  if (!(confettiCanvas instanceof HTMLCanvasElement)) {
    console.error('Confetti canvas is not an instance of Canvas. This is possibly a bug.');
    return;
  }

  const soundEffects = new SoundEffects();
  const MAX_REEL_ITEMS = 40;
  const CONFETTI_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
  let confettiAnimationId;

  // Gift list management
  interface GiftItem {
    image: string;
    name: string;
  }
  let giftList: GiftItem[] = [];
  let currentImageIndex = 0;

  /** Load gift list from localStorage */
  const loadGiftList = () => {
    const saved = localStorage.getItem('giftList');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle legacy format (array of strings)
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          giftList = parsed.map((img: string, idx: number) => ({ image: img, name: `Gift ${idx + 1}` }));
        } else {
          giftList = parsed;
        }
        updateGiftListUI();
        updateCurrentGiftImage();
      } catch (e) {
        console.error('Failed to load gift list:', e);
        giftList = [];
      }
    }
  };

  /** Save gift list to localStorage */
  const saveGiftList = () => {
    try {
      localStorage.setItem('giftList', JSON.stringify(giftList));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Gift list is too large.');
        alert('Storage limit exceeded. Please upload fewer or smaller images. The last upload was not saved.');
        // Remove the last added items that couldn't be saved
        giftList = giftList.slice(0, -1);
      } else {
        console.error('Failed to save gift list:', e);
      }
    }
  };

  /** Update the current gift image displayed */
  const updateCurrentGiftImage = () => {
    if (giftList.length > 0) {
      // Ensure index is within bounds
      if (currentImageIndex >= giftList.length) {
        currentImageIndex = giftList.length - 1;
      }
      if (currentImageIndex < 0) {
        currentImageIndex = 0;
      }

      uploadedImage.src = giftList[currentImageIndex].image;
      uploadedImage.style.display = 'block';
      giftNameDisplay.textContent = giftList[currentImageIndex].name;
      giftNameDisplay.style.display = 'block';

      // Show/hide navigation arrows
      imageNavLeft.style.display = giftList.length > 1 ? 'flex' : 'none';
      imageNavRight.style.display = giftList.length > 1 ? 'flex' : 'none';
    } else {
      uploadedImage.src = '';
      uploadedImage.style.display = 'none';
      giftNameDisplay.style.display = 'none';
      imageNavLeft.style.display = 'none';
      imageNavRight.style.display = 'none';
    }
  };

  /** Update the gift list UI in settings */
  const updateGiftListUI = () => {
    giftListContainer.innerHTML = '';

    if (giftList.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'gift-list-empty';
      emptyMsg.textContent = 'No gifts uploaded yet';
      giftListContainer.appendChild(emptyMsg);
      return;
    }

    giftList.forEach((giftItem, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'gift-list-item';

      const img = document.createElement('img');
      img.src = giftItem.image;
      img.className = 'gift-list-item-image';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'gift-list-item-info';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'gift-list-item-name';
      nameInput.value = giftItem.name;
      nameInput.placeholder = `Gift ${index + 1}`;
      nameInput.onchange = () => {
        giftList[index].name = nameInput.value || `Gift ${index + 1}`;
        saveGiftList();
      };

      infoDiv.appendChild(nameInput);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'gift-list-item-remove';
      removeBtn.textContent = '×';
      removeBtn.onclick = () => {
        giftList.splice(index, 1);
        saveGiftList();
        updateGiftListUI();
        updateCurrentGiftImage();
      };

      itemDiv.appendChild(img);
      itemDiv.appendChild(infoDiv);
      itemDiv.appendChild(removeBtn);
      giftListContainer.appendChild(itemDiv);
    });
  };

  /** Confeetti animation instance */
  const customConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  /** Triggers cconfeetti animation until animation is canceled */
  const confettiAnimation = () => {
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
    const confettiScale = Math.max(0.5, Math.min(1, windowWidth / 1100));

    customConfetti({
      particleCount: 1,
      gravity: 0.8,
      spread: 90,
      origin: { y: 0.6 },
      colors: [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]],
      scalar: confettiScale
    });

    confettiAnimationId = window.requestAnimationFrame(confettiAnimation);
  };

  /** Function to stop the winning animation */
  const stopWinningAnimation = () => {
    if (confettiAnimationId) {
      window.cancelAnimationFrame(confettiAnimationId);
    }
    sunburstSvg.style.display = 'none';
  };

  /**  Function to be trigger before spinning */
  const onSpinStart = () => {
    stopWinningAnimation();
    drawButton.disabled = true;
    settingsButton.disabled = true;
    giftSettingsButton.disabled = true;
    soundEffects.spin((MAX_REEL_ITEMS - 1) / 10);
  };

  /** Slot instance */
  const slot = new Slot({
    reelContainerSelector: '#reel',
    maxReelItems: MAX_REEL_ITEMS,
    onSpinStart,
    onSpinEnd: async () => {
      confettiAnimation();
      sunburstSvg.style.display = 'block';
      await soundEffects.win();
      drawButton.disabled = false;
      settingsButton.disabled = false;
      giftSettingsButton.disabled = false;
      spinCounter.textContent = `Spin: ${slot.spinCount}`;
    },
    onNameListChanged: stopWinningAnimation
  });

  /** To open the setting page */
  const onSettingsOpen = () => {
    nameListTextArea.value = slot.names.length ? slot.names.join('\n') : '';
    priorityNameListTextArea.value = slot.priorityNames.length ? slot.priorityNames.join('\n') : '';
    removeNameFromListCheckbox.checked = slot.shouldRemoveWinnerFromNameList;
    enableSoundCheckbox.checked = !soundEffects.mute;
    volumeControl.value = (soundEffects.volume * 100).toString();
    settingsWrapper.style.display = 'block';
  };

  /** To close the setting page */
  const onSettingsClose = () => {
    settingsContent.scrollTop = 0;
    settingsWrapper.style.display = 'none';
  };

  // Click handler for "Draw" button
  drawButton.addEventListener('click', () => {
    if (!slot.names.length) {
      onSettingsOpen();
      return;
    }

    slot.spin();
  });

  // Hide fullscreen button when it is not supported
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - for older browsers support
  if (!(document.documentElement.requestFullscreen && document.exitFullscreen)) {
    fullscreenButton.remove();
  }

  // Click handler for "Fullscreen" button
  fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  // Click handler for "Settings" button
  settingsButton.addEventListener('click', onSettingsOpen);

  // Click handler for "Save" button for setting page
  settingsSaveButton.addEventListener('click', () => {
    slot.names = nameListTextArea.value
      ? nameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
      : [];
    slot.priorityNames = priorityNameListTextArea.value
      ? priorityNameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
      : [];
    slot.shouldRemoveWinnerFromNameList = removeNameFromListCheckbox.checked;
    soundEffects.mute = !enableSoundCheckbox.checked;
    soundEffects.volume = parseInt(volumeControl.value, 10) / 100;
    onSettingsClose();
  });

  // Click handler for "Discard and close" button for setting page
  settingsCloseButton.addEventListener('click', onSettingsClose);

  /** To open the gift settings page */
  const onGiftSettingsOpen = () => {
    updateGiftListUI();
    giftSettingsWrapper.style.display = 'block';
  };

  /** To close the gift settings page */
  const onGiftSettingsClose = () => {
    giftSettingsContent.scrollTop = 0;
    giftSettingsWrapper.style.display = 'none';
  };

  // Click handler for "Gift Settings" button
  giftSettingsButton.addEventListener('click', onGiftSettingsOpen);

  // Click handler for "Save" button for gift settings page
  giftSettingsSaveButton.addEventListener('click', () => {
    onGiftSettingsClose();
  });

  // Click handler for "Discard and close" button for gift settings page
  giftSettingsCloseButton.addEventListener('click', onGiftSettingsClose);

  /** Compress image to reduce storage size */
  const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set max dimensions to reduce file size
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let { width } = img;
        let { height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else if (height > MAX_HEIGHT) {
          width *= (MAX_HEIGHT / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality
        const compressedData = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedData);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // Handle image upload (multiple files)
  imageUpload.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement;
    const { files } = target;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        return;
      }

      try {
        // Process all images concurrently
        const compressedImages = await Promise.all(imageFiles.map((file) => compressImage(file)));

        compressedImages.forEach((compressedImage, index) => {
          // Use filename without extension as the gift name
          const filename = imageFiles[index].name;
          const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
          giftList.push({
            image: compressedImage,
            name: nameWithoutExt
          });
        });

        saveGiftList();
        updateGiftListUI();
        updateCurrentGiftImage();
        imageUpload.value = ''; // Reset input
      } catch (error) {
        console.error('Failed to process images:', error);
        alert('Failed to upload some images. Please try uploading smaller images or fewer at a time.');
      }
    }
  });

  // Load gift list on page load
  loadGiftList();

  // Image navigation handlers
  imageNavLeft.addEventListener('click', (e) => {
    e.stopPropagation();
    if (giftList.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + giftList.length) % giftList.length;
      updateCurrentGiftImage();
    }
  });

  imageNavRight.addEventListener('click', (e) => {
    e.stopPropagation();
    if (giftList.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % giftList.length;
      updateCurrentGiftImage();
    }
  });

  // Click on left/right half of image box to navigate
  imageBox.addEventListener('click', (e) => {
    if (giftList.length <= 1) return;

    const rect = imageBox.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (clickX < halfWidth) {
      // Clicked left side - go to previous
      currentImageIndex = (currentImageIndex - 1 + giftList.length) % giftList.length;
    } else {
      // Clicked right side - go to next
      currentImageIndex = (currentImageIndex + 1) % giftList.length;
    }
    updateCurrentGiftImage();
  });
})();
