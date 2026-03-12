import type { PayloadRequest } from 'payload'

export const changePassword = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: { oldPassword?: string; newPassword?: string }
  try {
    body = (await req.json?.()) ?? {}
  } catch {
    return Response.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { oldPassword, newPassword } = body

  if (!oldPassword || !newPassword) {
    return Response.json({ message: 'oldPassword and newPassword are required' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return Response.json({ message: 'New password must be at least 8 characters' }, { status: 400 })
  }

  try {
    // Verify current password by attempting a login
    await req.payload.login({
      collection: 'users',
      data: { email: req.user.email!, password: oldPassword },
      req,
    })
  } catch {
    return Response.json({ message: 'Current password is incorrect' }, { status: 400 })
  }

  try {
    await req.payload.update({
      collection: 'users',
      id: req.user.id,
      data: { password: newPassword },
      overrideAccess: true,
    })

    return Response.json({ message: 'Password changed successfully' })
  } catch (err: any) {
    return Response.json({ message: err?.message ?? 'Failed to change password' }, { status: 500 })
  }
}
