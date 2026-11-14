import test from 'node:test';import assert from 'node:assert/strict';
import {overlap,timeSlots,computeRange} from '../src/booking-time.js';
test('back-to-back intervals do not conflict',()=>assert.equal(overlap('2027-01-01T10:00','2027-01-01T11:00','2027-01-01T11:00','2027-01-01T12:00'),false));
test('partial overlaps are detected',()=>assert.equal(overlap('2027-01-01T10:00','2027-01-01T12:00','2027-01-01T11:30','2027-01-01T13:00'),true));
test('30-minute locking keys are deterministic',()=>assert.deepEqual(timeSlots('2027-01-01T09:00:00','2027-01-01T10:30:00'),['2027-01-01T09:00','2027-01-01T09:30','2027-01-01T10:00']));
test('valid booking computes exact duration',()=>assert.equal(computeRange('2027-01-01','09:00','11:30',Date.parse('2026-01-01T00:00:00Z')).duration,2.5));
test('short booking rejected',()=>assert.throws(()=>computeRange('2027-01-01','09:00','09:30',0),/1–12 hours/));
test('past booking rejected',()=>assert.throws(()=>computeRange('2025-01-01','09:00','10:00',Date.parse('2026-01-01T00:00:00Z')),/future/));
