import {AfterViewChecked, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {Angle} from "./utils/angle";
import {FormControl} from "@angular/forms";
import {Point2d} from "./utils/point";
import {Assert, Random} from "./utils/utils";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewChecked {

  @ViewChild('MainCanvas', {static: true})
  private _canvas?: ElementRef<HTMLCanvasElement>;

  // Constants
  public readonly MAX_SCORE = 16;
  public readonly MIN_SCORE = 4;

  // Ability Scores
  public strength = new FormControl(10);
  public constitution = new FormControl(10);
  public dexterity = new FormControl(10);
  public intelligence = new FormControl(10);
  public charisma = new FormControl(10);
  public wisdom = new FormControl(10);

  // Symbol Properties
  public forceSquare = new FormControl(true);
  public drawBorder = new FormControl(true);
  public lineWidth = new FormControl(15);

  convertScoreToModifier(score: number): string {
    const sign = Math.sign(score - 10);
    const modifier = sign * Math.floor(Math.abs((score - 10) / 2));
    return (modifier >= 0 ? '+' : '') + modifier
  }

  randomizeAbilityScores(): void {
    [this.strength, this.constitution, this.dexterity, this.intelligence, this.charisma, this.wisdom]
      .forEach(score => score.setValue(Math.round(Random.between(this.MIN_SCORE, this.MAX_SCORE))))
  }

  loadCanvas(): ElementRef<HTMLCanvasElement> {
    return Assert.notNull(this._canvas, "MISSING CANVAS");
  }

  loadRenderingContext(): CanvasRenderingContext2D {
    return Assert.notNull(
      this.loadCanvas().nativeElement.getContext('2d'),
      "MISSING RENDERING CONTEXT"
    );
  }

  ngAfterViewChecked() {
    this.resizeCanvas();
    this.redrawCanvas();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.resizeCanvas();
    this.redrawCanvas();
  }

  resizeCanvas(): void {
    const nativeElement = this.loadCanvas().nativeElement;
    const parentElement = nativeElement.parentElement;
    if (parentElement) {
      const newWidth = parentElement.clientWidth;
      /* There seems to be some invisible, unchangeable, margin
       * causing the parent to always be 6px larger than the canvas.
       * Without the -6 to height calling this method increased
       * the parent's height by 6; growing the parent and canvas
       * infinitely. */
      const newHeight = parentElement.clientHeight - 6;
      const minSide = Math.min(newWidth, newHeight);
      nativeElement.width = this.forceSquare.value ? minSide : newWidth;
      nativeElement.height = this.forceSquare.value ? minSide : newHeight;
    }
  }

  redrawCanvas(): void {
    const ctx = this.loadRenderingContext();

    // Constants
    const minSide = Math.min(ctx.canvas.width, ctx.canvas.height);
    const center = {
      x: ctx.canvas.width / 2,
      y: ctx.canvas.height / 2
    }
    const radius = minSide / 5;

    // Clear Background
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw Border Rectangle
    if (this.drawBorder.value) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'black';
      ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // Handle Symbol Properties
    ctx.lineWidth = this.lineWidth.value;

    // Draw Core Circle
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius,
      Angle.fromDegrees(0).radians,
      Angle.fromDegrees(360).radians
    );
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Draw Ability Scores
    const scores = [
      this.constitution.value,
      this.dexterity.value,
      this.wisdom.value,
      this.charisma.value,
      this.intelligence.value,
      this.strength.value,
    ];
    const spacing = 360 / scores.length;
    scores.forEach((score, index) => {
      AppComponent.drawAbilityScoreArm(ctx, score, spacing * index, center, radius);
    });
  }

  private static drawAbilityScoreArm(ctx: CanvasRenderingContext2D,
                                     score: number,
                                     degrees: number,
                                     center: Point2d,
                                     radius: number): void {
    // save state so we can undo our transformations
    ctx.save();

    // set the line cap to round for easier drawing
    ctx.lineCap = 'round';

    // rotate based on which ability score we are drawing
    ctx.translate(center.x, center.y);
    ctx.rotate(Angle.fromDegrees(degrees).radians);
    ctx.translate(-center.x, -center.y);

    // invert the arm if the score is "negative"
    if (score < 10) {
      ctx.translate(center.x + radius, center.y);
      ctx.rotate(Angle.fromDegrees(180).radians);
      ctx.translate(-(center.x + radius), -center.y);
    }

    // adjust the score so we don't have to duplicate
    // logic between negative and positive scores.
    const adjustedScore = Math.abs(score - 10);

    // Constants
    const adjustedRadius = radius * 0.75;
    const dotRadius = radius / 25;
    const edge = {
      x: center.x + radius,
      y: center.y
    };
    const tipDot = {
      x: edge.x + adjustedRadius,
      y: edge.y
    };
    const botDot = {
      x: edge.x + (adjustedRadius * 0.50),
      y: center.y + (adjustedRadius * 0.50)
    };
    const topDot = {
      x: edge.x + (adjustedRadius * 0.50),
      y: center.y - (adjustedRadius * 0.50)
    }

    // 9 | 11 => Add Tip Dot
    if (adjustedScore >= 1) {
      ctx.beginPath();
      ctx.arc(tipDot.x, tipDot.y,
        dotRadius,
        Angle.fromDegrees(0).radians,
        Angle.fromDegrees(360).radians
      );
      ctx.closePath();
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

    // 8 | 12 => Add Tip Line
    if (adjustedScore >= 2) {
      ctx.beginPath();
      ctx.moveTo(edge.x, edge.y);
      ctx.lineTo(tipDot.x, tipDot.y);
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

    // 7 | 13 => Add Bot Dot
    if (adjustedScore >= 3) {
      ctx.beginPath();
      ctx.arc(botDot.x, botDot.y,
        dotRadius,
        Angle.fromDegrees(0).radians,
        Angle.fromDegrees(360).radians
      );
      ctx.closePath();
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

    // 6 | 14 => Add Bot Line
    if (adjustedScore >= 4) {
      ctx.beginPath();
      ctx.moveTo(tipDot.x, tipDot.y);
      ctx.lineTo(botDot.x, botDot.y);
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

    // 5 | 15 => Add Top Dot
    if (adjustedScore >= 5) {
      ctx.beginPath();
      ctx.arc(topDot.x, topDot.y,
        dotRadius,
        Angle.fromDegrees(0).radians,
        Angle.fromDegrees(360).radians
      );
      ctx.closePath();
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

    // 4 | 16 => Add Third Line
    if (adjustedScore >= 6) {
      ctx.beginPath();
      ctx.moveTo(tipDot.x, tipDot.y);
      ctx.lineTo(topDot.x, topDot.y);
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

    // undo our transformations
    ctx.restore();
  }

}
