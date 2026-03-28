interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  alphaChange: number;
  alphaDirection: number;
}

class ShootingStar {
  x = 0;
  y = 0;
  length = 0;
  speed = 0;
  active = true;

  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset(): void {
    this.x = Math.random() * this.width * 1.5;
    this.y = -10;
    this.length = Math.random() * 80 + 40;
    this.speed = Math.random() * 15 + 6;
    this.active = true;
  }

  update(): void {
    this.x -= this.speed;
    this.y += this.speed;
    if (this.x < -this.length || this.y > this.height + this.length) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    const tailX = this.x + this.length * (this.speed / (this.speed + 5));
    const tailY = this.y - this.length * (this.speed / (this.speed + 5));
    const g = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
    g.addColorStop(0, 'rgba(0,255,224,0.8)');
    g.addColorStop(1, 'rgba(0,255,224,0)');
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function initStarfield(): void {
  const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let shootingStar: ShootingStar | null = null;

  function resize(): void {
    width = canvas!.width = window.innerWidth;
    height = canvas!.height = window.innerHeight;
    stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2,
      alpha: Math.random(),
      alphaChange: Math.random() * 0.02 + 0.005,
      alphaDirection: Math.random() > 0.5 ? 1 : -1,
    }));
  }

  function drawStars(): void {
    ctx!.clearRect(0, 0, width, height);
    for (const star of stars) {
      star.alpha += star.alphaChange * star.alphaDirection;
      if (star.alpha <= 0.1 || star.alpha >= 0.8) star.alphaDirection *= -1;
      ctx!.beginPath();
      ctx!.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,255,255,${star.alpha * 0.5})`;
      ctx!.fill();
    }
  }

  function animate(): void {
    drawStars();
    if (shootingStar?.active) {
      shootingStar.update();
      shootingStar.draw(ctx!);
    }
    requestAnimationFrame(animate);
  }

  function spawnShootingStar(): void {
    if (!shootingStar?.active) {
      shootingStar = new ShootingStar(width, height);
    }
    setTimeout(spawnShootingStar, 4000 + Math.random() * 2000);
  }

  resize();
  animate();
  spawnShootingStar();
  window.addEventListener('resize', resize);
}
