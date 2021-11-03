/**
 * convert stream to buffer
 * @param {NodeJS.ReadWriteStream} stream
 * @returns {Buffer}
 */
function bufferStream(stream: NodeJS.ReadWriteStream): Promise<Buffer> {
  return new Promise((accept, reject) => {
    let chunks: Array<any> = [];

    stream
      .on("error", reject)
      .on("data", (chunk) => chunks.push(chunk))
      .on("end", () => accept(Buffer.concat(chunks)));
  });
}

export { bufferStream };
