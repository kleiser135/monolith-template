import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { ChangePasswordForm } from '@/components/features/auth/ChangePasswordForm';

interface JwtPayload {
  userId: string;
}

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, name: true },
    });
    return user;
  } catch (error) {
    // Invalid token, treat as unauthenticated
    return null;
  }
}

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-4">Profile</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Name</h2>
          <p className="text-muted-foreground">{user.name || 'Not set'}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Email</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <hr className="my-8" />

      <div>
        <h2 className="text-2xl font-bold mb-4">Change Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
} 