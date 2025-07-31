"use client"

import { motion } from "framer-motion";
import { Calendar, Users, MapPin, Clock, Star, ArrowRight, Menu, X, ChevronRight, Mail, Phone, Instagram, Twitter, Linkedin, Facebook, GamepadIcon, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LandingHeader } from "@/components/layout/headers";
import Image from "next/image";

function CardboardLanding() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [headerBg, setHeaderBg] = useState('bg-transparent');
    const [isClient, setIsClient] = useState(false);

    // Deterministic positions for floating dots to avoid hydration mismatches
    const floatingDots = [
        { left: 15.2, top: 23.4, duration: 3.2, delay: 0.3 },
        { left: 67.8, top: 78.1, duration: 4.1, delay: 1.2 },
        { left: 89.5, top: 12.6, duration: 3.7, delay: 0.8 },
        { left: 34.7, top: 65.9, duration: 4.4, delay: 1.8 },
        { left: 78.3, top: 45.2, duration: 3.9, delay: 0.5 },
        { left: 12.1, top: 87.3, duration: 3.4, delay: 1.5 },
        { left: 56.9, top: 34.7, duration: 4.2, delay: 0.9 },
        { left: 91.2, top: 56.8, duration: 3.6, delay: 1.1 },
        { left: 23.5, top: 19.4, duration: 4.0, delay: 0.7 },
        { left: 45.8, top: 73.2, duration: 3.8, delay: 1.6 },
        { left: 72.4, top: 28.9, duration: 3.5, delay: 0.4 },
        { left: 8.7, top: 62.1, duration: 4.3, delay: 1.3 },
        { left: 64.3, top: 91.5, duration: 3.3, delay: 0.6 },
        { left: 38.1, top: 17.8, duration: 4.1, delay: 1.4 },
        { left: 86.9, top: 39.7, duration: 3.7, delay: 1.0 },
        { left: 19.6, top: 54.3, duration: 3.9, delay: 0.2 },
        { left: 53.2, top: 82.6, duration: 4.2, delay: 1.7 },
        { left: 76.8, top: 15.1, duration: 3.4, delay: 0.8 },
        { left: 41.5, top: 68.4, duration: 3.8, delay: 1.2 },
        { left: 95.1, top: 43.7, duration: 4.0, delay: 0.5 }
    ];

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrollY(y);
            
            // Define section positions (approximate)
            const heroHeight = window.innerHeight;
            const featuresStart = heroHeight;
            const featuresHeight = 600; // Approximate
            const eventsStart = featuresStart + featuresHeight;
            const eventsHeight = 600; // Approximate
            const contactStart = eventsStart + eventsHeight;
            
            // Change header background based on scroll position
            if (y < featuresStart - 100) {
                setHeaderBg('bg-transparent'); // Hero section - fully transparent to blend with background image
            } else if (y < eventsStart - 100) {
                setHeaderBg('bg-slate-900/80'); // Features section - subtle dark background for contrast
            } else if (y < contactStart - 100) {
                setHeaderBg('bg-slate-900/90'); // Events section - slightly more opaque
            } else {
                setHeaderBg('bg-slate-800/95'); // Contact section - nearly opaque for readability
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                delay: 0.3 + i * 0.15,
                ease: [0.25, 0.4, 0.25, 1],
            },
        }),
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemFadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <LandingHeader 
                isMenuOpen={isMenuOpen}
                toggleMenu={toggleMenu}
                headerBg={headerBg}
                scrollY={scrollY}
            />

            {/* Mobile Menu */}
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed inset-0 z-50 bg-slate-900 md:hidden"
                >
                    <div className="container flex h-16 items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 flex items-center justify-center">
                                    <Image
                                        src="/cardboard-wizard-logo.png"
                                        alt="Cardboard Wizard"
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                </div>
                                <span className="font-bold text-xl text-white">CARDBOARD</span>
                            </div>
                        </div>
                        <button onClick={toggleMenu}>
                            <X className="h-6 w-6 text-white" />
                            <span className="sr-only">Close menu</span>
                        </button>
                    </div>
                    <motion.nav
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="container grid gap-3 pb-8 pt-6 px-6"
                    >
                        {["Features", "Events", "Community", "Contact"].map((item, index) => (
                            <motion.div key={index} variants={itemFadeIn}>
                                <a
                                    href={`#${item.toLowerCase()}`}
                                    className="flex items-center justify-between rounded-xl px-4 py-3 text-lg font-medium text-white hover:bg-slate-800"
                                    onClick={toggleMenu}
                                >
                                    {item}
                                    <ChevronRight className="h-4 w-4" />
                                </a>
                            </motion.div>
                        ))}
                        <motion.div variants={itemFadeIn} className="flex flex-col gap-3 pt-4">
                            <Button variant="outline" className="w-full rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800">
                                Log In
                            </Button>
                            <Button variant="outline" className="w-full rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800">Start Organizing</Button>
                        </motion.div>
                    </motion.nav>
                </motion.div>
            )}

            <main className="flex-1">
                {/* Hero Section */}
                <motion.section 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900 -mt-16 pt-16"
                    style={{
                        backgroundImage: "url('/hero-background.png')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat"
                    }}
                >
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        {isClient && floatingDots.map((dot, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
                                style={{
                                    left: `${dot.left}%`,
                                    top: `${dot.top}%`,
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    opacity: [0.3, 0.7, 0.3],
                                }}
                                transition={{
                                    duration: dot.duration,
                                    repeat: Infinity,
                                    delay: dot.delay,
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative z-10 container mx-auto px-6">
                        <div className="max-w-5xl mx-auto text-center">

                            <motion.h1
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                            >
                                Organize Epic
                                <br />
                                <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                    Game Nights
                                </span>
                            </motion.h1>

                        </div>
                    </div>
                </motion.section>

                {/* Features Section */}
                <section id="features" className="w-full py-16 md:py-24 bg-slate-800">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="container px-6"
                    >
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="inline-block rounded-full bg-purple-500/20 px-4 py-2 text-purple-400 text-sm font-medium"
                            >
                                Features
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white"
                            >
                                Everything You Need to Host Amazing Game Nights
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="mx-auto max-w-3xl text-slate-400 text-lg leading-relaxed"
                            >
                                From event planning to game recommendations, CARDBOARD has all the tools to make your board game nights legendary
                            </motion.p>
                        </div>
                        
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-3"
                        >
                            {[
                                {
                                    icon: <Calendar className="h-8 w-8 text-purple-500" />,
                                    title: "Smart Scheduling",
                                    description: "Easily schedule game nights with calendar integration, automated reminders, and availability tracking for all participants.",
                                },
                                {
                                    icon: <Users className="h-8 w-8 text-blue-500" />,
                                    title: "Player Management",
                                    description: "Manage RSVPs, track player preferences, skill levels, and ensure the perfect group size for every game type.",
                                },
                                {
                                    icon: <GamepadIcon className="h-8 w-8 text-purple-500" />,
                                    title: "Game Library",
                                    description: "Browse thousands of board games with detailed info, reviews, and get personalized recommendations for your group.",
                                },
                                {
                                    icon: <MapPin className="h-8 w-8 text-green-500" />,
                                    title: "Venue Discovery",
                                    description: "Find the perfect venues - local game stores, cafes, community centers, or arrange home hosting with ease.",
                                },
                                {
                                    icon: <Trophy className="h-8 w-8 text-yellow-500" />,
                                    title: "Tournaments & Scoring",
                                    description: "Create tournaments, track scores across multiple games, and maintain leaderboards for your gaming community.",
                                },
                                {
                                    icon: <Star className="h-8 w-8 text-pink-500" />,
                                    title: "Community Reviews",
                                    description: "Rate games and events, share experiences, and help others discover the best board gaming experiences in your area.",
                                },
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemFadeIn}
                                    whileHover={{ y: -5, transition: { duration: 0.3 } }}
                                    className="group relative overflow-hidden rounded-2xl bg-slate-900/50 p-8 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
                                >
                                    <div className="relative space-y-4">
                                        <div className="mb-4 p-3 bg-slate-800/50 rounded-xl w-fit">{feature.icon}</div>
                                        <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                                        <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </section>

                {/* Events Showcase */}
                <section id="events" className="w-full py-16 md:py-24 bg-slate-900">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="container px-6"
                    >
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="inline-block rounded-full bg-blue-500/20 px-4 py-2 text-blue-400 text-sm font-medium"
                            >
                                Events
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white"
                            >
                                Join the Gaming Community
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="mx-auto max-w-3xl text-slate-400 text-lg leading-relaxed"
                            >
                                Discover amazing board game events happening near you or create your own and watch your community grow
                            </motion.p>
                        </div>
                        
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3"
                        >
                            {[
                                {
                                    title: "Weekly Strategy Night",
                                    date: "Every Thursday 7PM",
                                    location: "Downtown Game Cafe",
                                    players: "6/8 players",
                                    games: ["Wingspan", "Terraforming Mars", "Scythe"],
                                    host: "Sarah M.",
                                    level: "Intermediate",
                                },
                                {
                                    title: "Family Game Day",
                                    date: "Saturday 2PM",
                                    location: "Community Center",
                                    players: "12/15 players",
                                    games: ["Ticket to Ride", "Splendor", "Azul"],
                                    host: "Mike & Lisa",
                                    level: "Beginner Friendly",
                                },
                                {
                                    title: "Dungeon Crawl Marathon",
                                    date: "Sunday 12PM",
                                    location: "The Board Room",
                                    players: "4/6 players",
                                    games: ["Gloomhaven", "Descent", "HeroQuest"],
                                    host: "Alex R.",
                                    level: "Advanced",
                                },
                            ].map((event, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemFadeIn}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                    className="group relative overflow-hidden rounded-2xl bg-slate-900/50 p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                                                <p className="text-sm text-slate-400">Hosted by {event.host}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                                {event.level}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Clock className="h-4 w-4 text-purple-500" />
                                                {event.date}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <MapPin className="h-4 w-4 text-blue-500" />
                                                {event.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Users className="h-4 w-4 text-indigo-500" />
                                                {event.players}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium mb-2 text-white">Featured Games:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {event.games.map((game, gameIndex) => (
                                                    <span
                                                        key={gameIndex}
                                                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                                                    >
                                                        {game}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <Button className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800">
                                            Join Event
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        <div className="flex justify-center mt-12">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button size="lg" className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-8 py-4 text-lg group">
                                    View All Events
                                    <motion.span
                                        initial={{ x: 0 }}
                                        whileHover={{ x: 3 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </motion.span>
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="w-full py-16 md:py-24 bg-slate-800">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="container grid items-center gap-12 px-6 lg:grid-cols-2"
                    >
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-6"
                        >
                            <div className="inline-block rounded-full bg-green-500/20 px-4 py-2 text-green-400 text-sm font-medium">Contact</div>
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">Ready to Roll the Dice?</h2>
                            <p className="max-w-[600px] text-slate-400 text-lg leading-relaxed">
                                Join thousands of board game enthusiasts who are already using CARDBOARD to organize amazing game nights. 
                                Get in touch to learn more or start your free trial today.
                            </p>
                            <div className="space-y-4">
                                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4">
                                    <div className="rounded-xl bg-slate-900/50 p-3">
                                        <Mail className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">Email Us</h3>
                                        <p className="text-sm text-slate-400">hello@cardboard.app</p>
                                    </div>
                                </motion.div>
                                <motion.div whileHover={{ x: 5 }} className="flex items-start gap-4">
                                    <div className="rounded-xl bg-slate-900/50 p-3">
                                        <Phone className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">Call Us</h3>
                                        <p className="text-sm text-slate-400">+1 (555) BOARD-GAME</p>
                                    </div>
                                </motion.div>
                            </div>
                            <div className="flex space-x-4 pt-4">
                                {[
                                    { icon: <Instagram className="h-5 w-5" />, label: "Instagram" },
                                    { icon: <Twitter className="h-5 w-5" />, label: "Twitter" },
                                    { icon: <Linkedin className="h-5 w-5" />, label: "LinkedIn" },
                                    { icon: <Facebook className="h-5 w-5" />, label: "Facebook" },
                                ].map((social, index) => (
                                    <motion.div key={index} whileHover={{ y: -3, scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <a
                                            href="#"
                                            className="rounded-xl bg-slate-900/50 p-3 text-slate-400 hover:text-purple-400 hover:bg-slate-800/50 transition-colors border border-slate-700/50 hover:border-slate-600/50"
                                        >
                                            {social.icon}
                                            <span className="sr-only">{social.label}</span>
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="rounded-2xl bg-slate-900/50 p-8 border border-slate-700/50"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Start Your Game Night Journey</h3>
                            <p className="text-slate-400 mb-6">
                                Fill out the form below and we'll help you get started with CARDBOARD.
                            </p>
                            <form className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label htmlFor="first-name" className="text-sm font-medium text-white">
                                            First name
                                        </label>
                                        <Input id="first-name" placeholder="Enter your first name" className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="last-name" className="text-sm font-medium text-white">
                                            Last name
                                        </label>
                                        <Input id="last-name" placeholder="Enter your last name" className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-white">
                                        Email
                                    </label>
                                    <Input id="email" type="email" placeholder="Enter your email" className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-white">
                                        Tell us about your game nights
                                    </label>
                                    <Textarea id="message" placeholder="What games do you love? How often do you play?" className="min-h-[120px] rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" />
                                </div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 py-3">
                                        Get Started with CARDBOARD
                                    </Button>
                                </motion.div>
                            </form>
                        </motion.div>
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-slate-700/50 bg-slate-900">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="container grid gap-8 px-6 py-12 lg:grid-cols-4"
                >
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <motion.div
                                whileHover={{ rotate: 10, scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="h-10 w-10 flex items-center justify-center shadow-lg"
                            >
                                <Image
                                    src="/cardboard-wizard-logo.png"
                                    alt="Cardboard Wizard"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                            </motion.div>
                            <span className="font-bold text-xl text-white">CARDBOARD</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                            Making board game nights legendary, one event at a time. Connect, play, and build lasting friendships through the power of tabletop gaming.
                        </p>
                        <div className="flex space-x-3">
                            {[
                                { icon: <Instagram className="h-5 w-5" />, label: "Instagram" },
                                { icon: <Twitter className="h-5 w-5" />, label: "Twitter" },
                                { icon: <Linkedin className="h-5 w-5" />, label: "LinkedIn" },
                                { icon: <Facebook className="h-5 w-5" />, label: "Facebook" },
                            ].map((social, index) => (
                                <motion.div key={index} whileHover={{ y: -3, scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors">
                                        {social.icon}
                                        <span className="sr-only">{social.label}</span>
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white mb-4">Features</h3>
                        <nav className="flex flex-col space-y-3 text-sm">
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Event Scheduling
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Player Management
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Game Library
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Venue Discovery
                            </a>
                        </nav>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white mb-4">Community</h3>
                        <nav className="flex flex-col space-y-3 text-sm">
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Find Events
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Host Events
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Game Reviews
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                Player Profiles
                            </a>
                        </nav>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Stay Updated</h3>
                        <p className="text-slate-400 text-sm">
                            Get the latest news about new features, events, and board game recommendations.
                        </p>
                        <form className="flex space-x-2">
                            <Input type="email" placeholder="Enter your email" className="flex-1 rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-400" />
                            <Button type="submit" className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800">
                                Subscribe
                            </Button>
                        </form>
                    </div>
                </motion.div>
                <div className="border-t border-slate-700/50">
                    <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0 px-6">
                        <p className="text-xs text-slate-500">
                            &copy; {new Date().getFullYear()} CARDBOARD. All rights reserved.
                        </p>
                        <p className="text-xs text-slate-500">Made with ❤️ for board game enthusiasts</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function CardboardLandingPage() {
    return <CardboardLanding />;
}
