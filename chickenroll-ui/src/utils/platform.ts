let _isIOS;

export const isIOS = (): boolean => {
  if (_isIOS == null) {
    _isIOS =
      /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  return _isIOS;
};
