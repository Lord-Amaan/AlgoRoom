let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

function emit(eventName, payload) {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit(eventName, payload);
}

module.exports = {
  setIo,
  getIo,
  emit,
};
