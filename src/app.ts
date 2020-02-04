import * as faceapi from "face-api.js";
// import { Context } from "vm";
import "./app.css";
export class App {
  private canvas: HTMLCanvasElement;
  private videoElement: HTMLVideoElement;
  // 60 images per seconds
  private FPS: number = 25;
  context: CanvasRenderingContext2D;
  private faceapi = faceapi;

  async detectFace(canvas) {
    // launch function when request new Frame
    // requestAnimationFrame(() => {
    //   // console.log(this)
    // });
    setTimeout(() => {
        this.detectFace(canvas);
    }, 1000 / this.FPS)

    const context = canvas.getContext("2d");
    const videoElement = document.querySelector("video");

    let detection = await faceapi
      // .detectAllFaces(
      .detectSingleFace(
        // canvas,
        videoElement,
        // new faceapi.TinyFaceDetectorOptions({ minConfidence: 0.1 })
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.03 })
      )
      // .withFaceLandmarks()
      .withFaceExpressions();

    console.log(detection);
    // if no face found try again
    if (!detection) return;

    const displaySize = {
      width: canvas.width,
      height: canvas.height
    };

    detection = faceapi.resizeResults(detection, displaySize);
    let expression = detection.expressions.asSortedArray()[0].expression;
    console.log(expression);
    let box = detection.detection.box;
    let emoji = new Image();
    emoji.src = `/emojis/${expression}.png`;
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.drawImage(
      emoji,
      0,
      0,
      512,
      512,
      box.x,
      box.y,
      box.width,
      box.height
    );
    // setTimeout(() => this.detectFace(), 1000 / this.FPS);
    // requestAnimationFrame(() => {
    //   // console.log(this)
    //   this.detectFace()
    // })
  }

  async drawEmoji(box, expression) {
    let emoji = new Image();
    emoji.src = `/emojis/${expression}.png`;
    this.context.drawImage(
      emoji,
      0,
      0,
      512,
      512,
      box.x,
      box.y,
      box.width,
      box.height
    );
  }

  public async attached() {
    await this.loadModel();

    this.getMediaStream().then((stream: MediaStream) => {
      if (this.videoElement.srcObject !== undefined) {
        this.videoElement.srcObject = stream;
      } else {
        this.videoElement.src = window.URL.createObjectURL(stream);
      }
      this.videoElement.onloadedmetadata = this.videoElement.play;

      // video 'play' event listener
      this.videoElement.addEventListener(
        "play",
        async () => {
          console.log("play");
          const canvas: HTMLCanvasElement = document.createElement("canvas");
          // set canvas height and width to video element dims
          canvas.height = this.videoElement.videoHeight;
          // canvas.height = window.innerHeight;
          // canvas.width =  document.querySelector('video').clientWidth;
          canvas.width = this.videoElement.videoWidth;
          // this.videoElement.
          document.body.appendChild(canvas);
          this.detectFace(canvas);
        },
        false
      );
    });
  }

  public getMediaStream(): Promise<MediaStream> {
    if (navigator.mediaDevices === undefined) {
      (navigator as any).mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia !== undefined) {
      return navigator.mediaDevices.getUserMedia({ video: true });
    }

    const getUserMedia =
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia;
    if (!getUserMedia) {
      return Promise.reject(
        new Error("getUserMedia is not implemented in this browser")
      );
    }

    return new Promise((resolve, reject) => {
      getUserMedia.call(navigator, { video: true }, resolve, reject);
    });
  }

  // public getCurrentImage(): string {
  //   const canvas: HTMLCanvasElement = document.createElement("canvas");
  //   document.body.appendChild(canvas);

  //   const width: number = this.videoElement.clientWidth;
  //   const height: number = this.videoElement.clientHeight;
  //   canvas.width = width;
  //   canvas.height = height;
  //   const context: CanvasRenderingContext2D = canvas.getContext("2d");
  //   context.drawImage(this.videoElement, 0, 0, width, height);
  //   const dataURL: string = canvas.toDataURL("image/png");
  //   document.body.removeChild(canvas);
  //   return dataURL;
  // }

  async loadModel() {
    // await faceapi.loadSsdMobilenetv1Model("/models");
    await faceapi.loadTinyFaceDetectorModel("/models");
    // await faceapi.loadFaceDetectionModel("/models");
    await faceapi.loadFaceExpressionModel("/models");
    // faceapi.nets.faceExpressionNet.isLoaded
    // await faceapi.loadFaceLandmarkModel("/models");
    // await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  }
}
