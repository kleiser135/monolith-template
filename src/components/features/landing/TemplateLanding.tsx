"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Badge } from "@/components/ui/badge/badge";
import { ArrowRight, CheckCircle, Code, Shield, Zap } from "lucide-react";

export function TemplateLanding() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <motion.section 
        initial="initial"
        animate="animate"
        variants={staggerChildren}
        className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 sm:px-6 lg:px-8"
      >
        <motion.div variants={fadeInUp} className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            Production Ready
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-primary">
            Build Your Next App
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            A modern, production-ready Next.js template with authentication, testing, and beautiful UI components. 
            Skip the boilerplate and start building features from day one.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
        className="py-24 bg-muted/30"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Built with the latest technologies and best practices to help you ship faster.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerChildren}
            className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
          >
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <motion.div variants={fadeInUp}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
                        <Shield className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <CardTitle>Authentication</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Complete authentication system with login, signup, password reset, 
                      email verification, and protected routes out of the box.
                    </CardDescription>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />JWT-based authentication</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Password reset flow</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Email verification</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <Zap className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <CardTitle>Testing</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Comprehensive testing setup with unit tests, integration tests, 
                      and end-to-end testing using Vitest and Cypress.
                    </CardDescription>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Comprehensive unit tests</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />E2E test coverage</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />TDD workflow</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <Code className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <CardTitle>Beautiful UI</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Modern, accessible UI components built with Radix UI and Tailwind CSS. 
                      Dark mode support and smooth animations included.
                    </CardDescription>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Radix UI components</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Dark/light mode</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" />Framer Motion</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </dl>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
        className="py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Get started in minutes with our streamlined development workflow.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerChildren}
            className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl"
          >
            <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
              <motion.div variants={fadeInUp} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold" aria-label="Step 1 of 3">
                  1
                </div>
                <h3 className="mt-6 text-lg font-semibold">Clone & Setup</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Clone the repository, install dependencies, and configure your environment variables.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  2
                </div>
                <h3 className="mt-6 text-lg font-semibold">Customize</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Update branding, add your features, and customize the UI to match your vision.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  3
                </div>
                <h3 className="mt-6 text-lg font-semibold">Deploy</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deploy to Vercel, Netlify, or your preferred platform with our deployment guides.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm leading-6 text-muted-foreground">
              Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and modern web technologies.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
