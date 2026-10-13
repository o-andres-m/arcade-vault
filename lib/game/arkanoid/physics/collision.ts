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
    ball.y = paddle.y - ball.h

    // Calculate hit position on paddle (0 = left, 1 = right)
    const hitPos = Math.max(0, Math.min(1, (ballCenterX - paddle.x) / paddle.w))

    // Angle based on hit position: -75° to +75° from vertical
    // Left edge (-75°) = vx negative, Right edge (+75°) = vx positive
    const angleMultiplier = (hitPos - 0.5) * 2 // -1 to 1
    const baseSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)

    // Use angle to set velocities (55° angle range for more dynamic bounces)
    const angle = angleMultiplier * (Math.PI / 4) // ±45°
    ball.vx = Math.sin(angle) * baseSpeed
    ball.vy = -Math.abs(Math.cos(angle) * baseSpeed) // Always upward

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
