// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { createSelfSuspendingFrameLoop, type SelfSuspendingFrameLoop } from '../selfSuspendingFrameLoop';

class FakeFrameScheduler {
    private _nextHandle = 1;
    private _scheduled = new Map<number, (now: number) => void>();
    private _now = 0;

    schedule = (callback: (now: number) => void): number => {
        const handle = this._nextHandle++;
        this._scheduled.set(handle, callback);
        return handle;
    };

    cancel = (handle: number): void => {
        this._scheduled.delete(handle);
    };

    get scheduledCount(): number {
        return this._scheduled.size;
    }

    runFrame(): void {
        this._now += 16;
        const due = [...this._scheduled.values()];
        this._scheduled.clear();
        due.forEach(callback => callback(this._now));
    }
}

describe('when the loop has not been woken', () => {
    let scheduler: FakeFrameScheduler;
    let loop: SelfSuspendingFrameLoop;

    beforeEach(() => {
        scheduler = new FakeFrameScheduler();
        loop = createSelfSuspendingFrameLoop(() => true, scheduler.schedule, scheduler.cancel);
    });

    it('should not be running', () => loop.isRunning.should.be.false);
    it('should schedule no frames', () => scheduler.scheduledCount.should.equal(0));
});

describe('when waking a suspended loop', () => {
    let scheduler: FakeFrameScheduler;
    let loop: SelfSuspendingFrameLoop;
    let step: sinon.SinonStub;

    beforeEach(() => {
        scheduler = new FakeFrameScheduler();
        step = sinon.stub().returns(true);
        loop = createSelfSuspendingFrameLoop(step, scheduler.schedule, scheduler.cancel);
        loop.wake();
    });

    it('should be running', () => loop.isRunning.should.be.true);
    it('should schedule exactly one frame', () => scheduler.scheduledCount.should.equal(1));
    it('should not run the step until the frame fires', () => step.called.should.be.false);
});

describe('when waking an already running loop repeatedly', () => {
    let scheduler: FakeFrameScheduler;

    beforeEach(() => {
        scheduler = new FakeFrameScheduler();
        const loop = createSelfSuspendingFrameLoop(() => true, scheduler.schedule, scheduler.cancel);
        loop.wake();
        loop.wake();
        loop.wake();
    });

    it('should keep a single scheduled frame', () => scheduler.scheduledCount.should.equal(1));
});

describe('when the step keeps reporting motion', () => {
    let scheduler: FakeFrameScheduler;
    let step: sinon.SinonStub;

    beforeEach(() => {
        scheduler = new FakeFrameScheduler();
        step = sinon.stub().returns(true);
        const loop = createSelfSuspendingFrameLoop(step, scheduler.schedule, scheduler.cancel);
        loop.wake();
        scheduler.runFrame();
        scheduler.runFrame();
    });

    it('should run the step once per frame', () => step.callCount.should.equal(2));
    it('should stay scheduled for the next frame', () => scheduler.scheduledCount.should.equal(1));
});

describe('when the step reports the motion has settled', () => {
    let scheduler: FakeFrameScheduler;
    let loop: SelfSuspendingFrameLoop;
    let step: sinon.SinonStub;

    beforeEach(() => {
        scheduler = new FakeFrameScheduler();
        step = sinon.stub().returns(false);
        loop = createSelfSuspendingFrameLoop(step, scheduler.schedule, scheduler.cancel);
        loop.wake();
        scheduler.runFrame();
        scheduler.runFrame();
        scheduler.runFrame();
    });

    it('should run the step for the woken frame only', () => step.callCount.should.equal(1));
    it('should suspend', () => loop.isRunning.should.be.false);
    it('should schedule no further frames', () => scheduler.scheduledCount.should.equal(0));
});

describe('when waking again after the loop suspended', () => {
    let scheduler: FakeFrameScheduler;
    let loop: SelfSuspendingFrameLoop;
    let step: sinon.SinonStub;

    beforeEach(() => {
        scheduler = new FakeFrameScheduler();
        step = sinon.stub().returns(false);
        loop = createSelfSuspendingFrameLoop(step, scheduler.schedule, scheduler.cancel);
        loop.wake();
        scheduler.runFrame();
        loop.wake();
        scheduler.runFrame();
    });

    it('should run the step once per wake', () => step.callCount.should.equal(2));
});

describe('when stopping a running loop', () => {
    let scheduler: FakeFrameScheduler;
    let loop: SelfSuspendingFrameLoop;
    let step: sinon.SinonStub;

    beforeEach(() => {
        scheduler = new FakeFrameScheduler();
        step = sinon.stub().returns(true);
        loop = createSelfSuspendingFrameLoop(step, scheduler.schedule, scheduler.cancel);
        loop.wake();
        loop.stop();
        scheduler.runFrame();
    });

    it('should not be running', () => loop.isRunning.should.be.false);
    it('should cancel the scheduled frame so the step never runs', () => step.called.should.be.false);
});
