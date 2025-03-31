export class PatientSystem {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.patients = [];
    this.currentPatient = null;
    this.patientQueue = [];
    this.healingAnimations = [];
  }

  init() {
    // Register event listeners
    this.eventSystem.on('patient:arrive', this.handlePatientArrival.bind(this));
    this.eventSystem.on('patient:heal', this.handlePatientHeal.bind(this));
    this.eventSystem.on('patient:dismiss', this.handlePatientDismiss.bind(this));
    this.eventSystem.on('patient:effect', this.handlePatientEffect.bind(this));
  }

  update() {
    // Update patient states and animations
    this.updatePatientStates();
    this.updateHealingAnimations();
  }

  render(ctx) {
    // Render current patient and waiting patients
    this.renderCurrentPatient(ctx);
    this.renderPatientQueue(ctx);
    this.renderHealingEffects(ctx);
  }

  renderCurrentPatient(ctx) {
    if (!this.currentPatient) return;

    const { x, y, width, height, health, maxHealth, status } = this.currentPatient;

    // Draw patient
    ctx.fillStyle = '#2a4';
    ctx.fillRect(x, y, width, height);

    // Draw health bar
    const barWidth = width;
    const barHeight = 10;
    const healthPercent = Math.max(0, health / maxHealth);

    ctx.fillStyle = '#800';
    ctx.fillRect(x, y - 20, barWidth, barHeight);
    ctx.fillStyle = '#0a0';
    ctx.fillRect(x, y - 20, barWidth * healthPercent, barHeight);

    // Draw status effects
    this.renderPatientStatus(ctx, this.currentPatient);
  }

  renderPatientQueue(ctx) {
    // Render waiting patients as smaller icons
    this.patientQueue.forEach((patient, index) => {
      const size = 30;
      const padding = 10;
      const x = 20;
      const y = 100 + (size + padding) * index;

      ctx.fillStyle = '#2a4';
      ctx.fillRect(x, y, size, size);

      const healthPercent = patient.health / patient.maxHealth;
      ctx.fillStyle = '#800';
      ctx.fillRect(x, y + size + 2, size, 4);
      ctx.fillStyle = '#0a0';
      ctx.fillRect(x, y + size + 2, size * healthPercent, 4);
    });
  }

  renderPatientStatus(ctx, patient) {
    // Render status effects above patient
    patient.status.forEach((status, index) => {
      const iconSize = 20;
      const x = patient.x + index * (iconSize + 5);
      const y = patient.y - 40;

      // Draw status icon
      ctx.fillStyle = status.color || '#fff';
      ctx.fillRect(x, y, iconSize, iconSize);

      // Draw status duration if applicable
      if (status.duration) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(status.duration, x + iconSize/2, y + iconSize + 12);
      }
    });
  }

  renderHealingEffects(ctx) {
    this.healingAnimations = this.healingAnimations.filter(anim => {
      anim.render(ctx);
      anim.update();
      return !anim.finished;
    });
  }

  updatePatientStates() {
    if (this.currentPatient) {
      // Update current patient status effects
      this.currentPatient.status = this.currentPatient.status.filter(status => {
        status.duration--;
        if (status.onTick) {
          status.onTick(this.currentPatient);
        }
        return status.duration > 0;
      });
    }
  }

  updateHealingAnimations() {
    // Update healing effect animations
  }

  handlePatientArrival(data) {
    const { patient } = data;
    
    patient.status = patient.status || [];
    
    if (!this.currentPatient) {
      this.setCurrentPatient(patient);
    } else {
      this.patientQueue.push(patient);
    }
    
    this.eventSystem.emit('patient:arrived', { patient });
  }

  handlePatientHeal(data) {
    const { amount, type = 'normal' } = data;
    
    if (this.currentPatient) {
      this.healPatient(this.currentPatient, amount, type);
    }
  }

  handlePatientDismiss() {
    if (!this.currentPatient) return;

    const dismissed = this.currentPatient;
    
    // Get next patient from queue
    const nextPatient = this.patientQueue.shift();
    this.setCurrentPatient(nextPatient);
    
    this.eventSystem.emit('patient:dismissed', { patient: dismissed });
  }

  handlePatientEffect(data) {
    const { effect } = data;
    
    if (this.currentPatient) {
      this.currentPatient.status.push(effect);
    }
  }

  setCurrentPatient(patient) {
    this.currentPatient = patient;
    if (patient) {
      // Position patient in treatment area
      patient.x = 400; // These would be calculated based on layout
      patient.y = 300;
      patient.width = 60;
      patient.height = 100;
    }
  }

  healPatient(patient, amount, type) {
    const oldHealth = patient.health;
    patient.health = Math.min(patient.maxHealth, patient.health + amount);
    const actualHeal = patient.health - oldHealth;

    if (actualHeal > 0) {
      this.addHealingAnimation(patient, actualHeal, type);
      this.eventSystem.emit('patient:healed', {
        patient,
        amount: actualHeal,
        type
      });
    }

    // Check if patient is fully healed
    if (patient.health >= patient.maxHealth) {
      this.eventSystem.emit('patient:recovered', { patient });
      this.handlePatientDismiss();
    }
  }

  addHealingAnimation(target, amount, type) {
    this.healingAnimations.push({
      x: target.x + target.width / 2,
      y: target.y,
      value: amount,
      type,
      age: 0,
      maxAge: 60,
      get finished() {
        return this.age >= this.maxAge;
      },
      update() {
        this.age++;
        this.y--;
      },
      render(ctx) {
        const alpha = 1 - this.age / this.maxAge;
        ctx.fillStyle = `rgba(0, 255, 128, ${alpha})`;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+' + this.value, this.x, this.y);
      }
    });
  }
}
