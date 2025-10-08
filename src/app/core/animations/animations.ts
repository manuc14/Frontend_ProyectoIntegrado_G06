/* ==========================================================================
   ANIMACIONES REUTILIZABLES - FRONTEND PROYECTO INTEGRADO G06
   ========================================================================== */

import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

/* --------------------------------------------------------------------------
   ANIMACIONES DE BOTONES
   -------------------------------------------------------------------------- */

/**
 * Animación sutil de hover para botones
 * Escalado y cambio de opacidad suave
 */
export const buttonHover = trigger('buttonHover', [
  state('normal', style({
    transform: 'scale(1)',
    opacity: 1
  })),
  state('hover', style({
    transform: 'scale(1.02)',
    opacity: 0.9
  })),
  transition('normal <=> hover', [
    animate('200ms ease-in-out')
  ])
]);

/**
 * Animación de pulsado para botones
 * Efecto de presionado visual
 */
export const buttonPress = trigger('buttonPress', [
  state('normal', style({
    transform: 'scale(1)'
  })),
  state('pressed', style({
    transform: 'scale(0.98)'
  })),
  transition('normal => pressed', [
    animate('100ms ease-in')
  ]),
  transition('pressed => normal', [
    animate('150ms ease-out')
  ])
]);

/* --------------------------------------------------------------------------
   ANIMACIONES DE NAVEGACIÓN
   -------------------------------------------------------------------------- */

/**
 * Animación para elementos de navegación activos
 * Transición suave de estado activo/inactivo
 */
export const navActiveState = trigger('navActiveState', [
  state('inactive', style({
    backgroundColor: 'transparent',
    transform: 'scale(1)'
  })),
  state('active', style({
    backgroundColor: '#052226',
    transform: 'scale(1.05)'
  })),
  transition('inactive <=> active', [
    animate('300ms ease-in-out')
  ])
]);

/**
 * Animación de hover para elementos de navegación
 */
export const navHover = trigger('navHover', [
  state('normal', style({
    transform: 'translateY(0)',
    boxShadow: 'none'
  })),
  state('hover', style({
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 224, 161, 0.15)'
  })),
  transition('normal <=> hover', [
    animate('250ms ease-out')
  ])
]);

/* --------------------------------------------------------------------------
   ANIMACIONES DE ENTRADA/SALIDA
   -------------------------------------------------------------------------- */

/**
 * Animación de aparición suave (fade in)
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

/**
 * Animación de deslizamiento desde arriba
 */
export const slideInFromTop = trigger('slideInFromTop', [
  transition(':enter', [
    style({ transform: 'translateY(-20px)', opacity: 0 }),
    animate('350ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ])
]);

/* --------------------------------------------------------------------------
   ANIMACIONES DE FORMULARIOS
   -------------------------------------------------------------------------- */

/**
 * Animación de shake para errores
 */
export const shakeError = trigger('shakeError', [
  transition('* => shake', [
    animate('600ms ease-in-out', keyframes([
      style({ transform: 'translateX(0)' }),
      style({ transform: 'translateX(-10px)' }),
      style({ transform: 'translateX(10px)' }),
      style({ transform: 'translateX(-10px)' }),
      style({ transform: 'translateX(10px)' }),
      style({ transform: 'translateX(0)' })
    ]))
  ])
]);

/**
 * Animación de focus para inputs
 */
export const inputFocus = trigger('inputFocus', [
  state('normal', style({
    borderColor: '#17303a',
    boxShadow: 'none'
  })),
  state('focused', style({
    borderColor: '#00e0a1',
    boxShadow: '0 0 0 2px rgba(0, 224, 161, 0.2)'
  })),
  transition('normal <=> focused', [
    animate('200ms ease-in-out')
  ])
]);

/* --------------------------------------------------------------------------
   ANIMACIONES DE CARGA
   -------------------------------------------------------------------------- */

/**
 * Animación de pulso para elementos de carga
 */
export const loadingPulse = trigger('loadingPulse', [
  state('loading', style({
    opacity: 0.6
  })),
  state('loaded', style({
    opacity: 1
  })),
  transition('loaded => loading', [
    animate('800ms ease-in-out', keyframes([
      style({ opacity: 1 }),
      style({ opacity: 0.6 }),
      style({ opacity: 1 })
    ]))
  ])
]);

/* --------------------------------------------------------------------------
   ANIMACIONES DE NOTIFICACIONES
   -------------------------------------------------------------------------- */

/**
 * Animación para banners de notificación
 */
export const bannerSlide = trigger('bannerSlide', [
  transition(':enter', [
    style({ 
      transform: 'translateY(-20px) scale(0.95)', 
      opacity: 0 
    }),
    animate('300ms ease-out', style({ 
      transform: 'translateY(0) scale(1)', 
      opacity: 1 
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ 
      transform: 'translateY(-10px) scale(0.98)', 
      opacity: 0 
    }))
  ])
]);