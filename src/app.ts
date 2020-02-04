import * as faceapi from "face-api.js";
// import { Context } from "vm";
import "./app.css";
export class App {
  // context: canvas.;
  private canvas: HTMLCanvasElement;
  // private context: CanvasRenderingContext2DSettings;
  private videoElement: HTMLVideoElement;
  private FPS: number = 60;
  private expression: string = "";
  context: CanvasRenderingContext2D;

  async detectFace() {
    const canvas = this.canvas;
    const context = this.context;

    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    const detections = await faceapi
      .detectAllFaces(
        //  this.videoElement,
        canvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 })
      )
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length == 0) return;
    const displaySize = {
      width: canvas.width,
      height: canvas.height
    };
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    resizedDetections.map(detection => {
      this.expression = detection.expressions.asSortedArray()[0].expression;
      let box = detection.detection.box;
      let emoji = new Image();
      emoji.src = `/emojis/${this.expression}.png`;
      //  this.draw();
      context.drawImage(
        emoji,
        0,
        0,
        512,
        512,
        box.x,
        box.y,
        box.width + 5,
        box.height + 5
      );
    });
  }
  async draw(canvas, context) {
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
  }

  public async attached() {
    await this.loadModel();
    this.canvas = document.querySelector("canvas");
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
          setInterval(() => this.detectFace(), 1000 / this.FPS);
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

  public getCurrentImage(): string {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    document.body.appendChild(canvas);

    const width: number = this.videoElement.clientWidth;
    const height: number = this.videoElement.clientHeight;
    canvas.width = width;
    canvas.height = height;
    const context: CanvasRenderingContext2D = canvas.getContext("2d");
    context.drawImage(this.videoElement, 0, 0, width, height);
    const dataURL: string = canvas.toDataURL("image/png");
    document.body.removeChild(canvas);
    //console.log(dataURL);
    return dataURL;
  }

  async loadModel() {
    // await faceapi.loadFaceExpressionModel("/models");
    await faceapi.loadSsdMobilenetv1Model("/models");
    await faceapi.loadFaceDetectionModel("/models");
    await faceapi.loadFaceLandmarkModel("/models");
    await faceapi.loadFaceExpressionModel("/models");
    // await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");

    //console.log(faceapi.nets);
  }
}
