import { Ball } from '../entities/Ball'
import { Paddle } from '../entities/Paddle'
import { Block } from '../entities/Block'

export function checkBallPaddleCollision(ball: Ball, paddle: Paddle): boolean {
  const ballCenterX = ball.x + ball.w / 2
  const ballCenterY = ball.y + ball.h / 2
  const ballRadius = ball.w / 2

  // AABB closest point to circle center
  const closestX = Math.max(paddle.x, Math.min(ballCenterX, paddle.x + paddle.w))
  const closestY = Math.max(paddle.y, Math.min(ballCenterY, paddle.y + paddle.h))

  const distX = ballCenterX - closestX
  const distY = ballCenterY - closestY

  const distSquared = distX * distX + distY * distY
  const radiusSquared = ballRadius * ballRadius

  if (distSquared < radiusSquared) {
    // Bounce logic: reverse vertical velocity and adjust position
    ball.vy = -Math.abs(ball.vy)
    ball.y = paddle.y - ball.h

    // Add horizontal component based on where ball hits paddle
    const hitPos = (ballCenterX - paddle.x) / paddle.w // 0 to 1
    const maxHorizontalVelocity = Math.abs(ball.vx) * 0.5
    ball.vx = (hitPos - 0.5) * maxHorizontalVelocity * 2

    return true
  }

  return false
}

export function checkBallBlockCollision(ball: Ball, block: Block): boolean {
  if (!block.alive) return false

  const ballCenterX = ball.x + ball.w / 2
  const ballCenterY = ball.y + ball.h / 2
  const ballRadius = ball.w / 2

  // AABB closest point to circle center
  const closestX = Math.max(block.x, Math.min(ballCenterX, block.x + block.w))
  const closestY = Math.max(block.y, Math.min(ballCenterY, block.y + block.h))

  const distX = ballCenterX - closestX
  const distY = ballCenterY - closestY

  const distSquared = distX * distX + distY * distY
  const radiusSquared = ballRadius * ballRadius

  if (distSquared < radiusSquared) {
    block.alive = false

    // Determine collision side and bounce accordingly
    const overlapLeft = ballCenterX - (block.x + block.w)
    const overlapRight = block.x - ballCenterX
    const overlapTop = ballCenterY - (block.y + block.h)
    const overlapBottom = block.y - ballCenterY

    const minOverlap = Math.max(
      Math.min(Math.abs(overlapLeft), Math.abs(overlapRight)),
      Math.min(Math.abs(overlapTop), Math.abs(overlapBottom))
    )

    if (
      minOverlap === Math.abs(overlapLeft) ||
      minOverlap === Math.abs(overlapRight)
    ) {
      ball.vx *= -1
    } else {
      ball.vy *= -1
    }

    return true
  }

  return false
}
