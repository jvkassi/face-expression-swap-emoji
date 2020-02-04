import * as faceapi from "face-api.js";
// import { Context } from "vm";
import "./app.css";
export class App {
  private canvas: HTMLCanvasElement;
  private videoElement: HTMLVideoElement;
  // 60 images per seconds
  private FPS: number = 60;
  context: CanvasRenderingContext2D;
  private faceapi = faceapi;

  async detectFace() {
    const canvas = this.canvas;
    const context = this.context;
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    let detection = await faceapi
      // .detectAllFaces(
      .detectSingleFace(
        canvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 })
      )
      // .withFaceLandmarks()
      .withFaceExpressions();

      // if no face found try again
    if (!detection) {
      setTimeout(() => this.detectFace(), 1000 / this.FPS);
      return;
    }

    const displaySize = {
      width: canvas.width,
      height: canvas.height
    };

    detection = faceapi.resizeResults(detection, displaySize);
    let expression = detection.expressions.asSortedArray()[0].expression;
    let box = detection.detection.box;
    this.drawEmoji(box, expression);
    setTimeout(() => this.detectFace(), 1000 / this.FPS);
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
    this.canvas = document.querySelector("canvas");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.context = this.canvas.getContext("2d");

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
          this.detectFace();
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
    // console.log(Object.keys(faceapi.nets.ssdMobilenetv1));
    // console.log(faceapi.nets.ssdMobilenetv1.isLoaded);
    await faceapi.loadSsdMobilenetv1Model("/models");
    await faceapi.loadFaceDetectionModel("/models");
    // await faceapi.loadFaceLandmarkModel("/models");
    await faceapi.loadFaceExpressionModel("/models");
    // await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  }
}
