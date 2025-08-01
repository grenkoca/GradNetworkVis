import React, { useEffect, useRef } from 'react';

const DoubleHelixArtwork = () => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 800;
    const height = canvas.height = 600;
    let time = 0;
    const backboneParticles1 = [];
    const backboneParticles2 = [];
    const basePairs = [];
    let allPoints = [];
    
    // B-DNA specifications (scaled for visualization)
    const ROTATION_PER_BP = 34.3 * Math.PI / 180; // 34.3° in radians
    const BP_PER_TURN = 10.5;
    const RISE_PER_BP = 8; // 3.32 Å scaled up for visibility
    const HELIX_DIAMETER = 60; // 20 Å scaled up for visibility
    const HELIX_RADIUS = HELIX_DIAMETER / 2;
    const INCLINATION = -1.2 * Math.PI / 180; // -1.2° in radians
    const PROPELLER_TWIST = 16 * Math.PI / 180; // 16° in radians
    const PITCH_PER_TURN = RISE_PER_BP * BP_PER_TURN; // 33.2 Å equivalent
    
    const numBasePairs = 80;
    const TWO_PI = Math.PI * 2;
    const animationSpeed = 0.01;

    const random = (min, max) => {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    };

    const map = (value, start1, stop1, start2, stop2) => {
      return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    };

    const dist = (x1, y1, z1, x2, y2, z2) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    class BackboneParticle {
      constructor(bpIndex, strand) {
        this.bpIndex = bpIndex;
        this.strand = strand; // 1 or 2
        this.baseY = (bpIndex - numBasePairs / 2) * RISE_PER_BP;
        this.size = random(2, 4);
        this.opacity = random(160, 200);
        this.entropy = random(0.8, 1.2); // Random fluctuation factor
        this.phaseNoise = random(0, TWO_PI); // Random phase offset for breathing
        this.radiusNoise = random(0.85, 1.15); // Random radius variation
        this.yNoise = random(-2, 2); // Random y position variation
        this.connections = new Set(); // Track dynamic connections
      }

      update(time) {
        // Calculate rotation based on B-DNA geometry with entropy
        const rotation = this.bpIndex * ROTATION_PER_BP + time * animationSpeed * this.entropy;
        
        // Apply strand-specific phase offset (180° for opposite strands)
        const strandPhase = this.strand === 1 ? 0 : Math.PI;
        const totalRotation = rotation + strandPhase + this.phaseNoise * 0.1;
        
        // Add breathing motion and entropy
        const breathingRadius = HELIX_RADIUS * this.radiusNoise * (1 + Math.sin(time * 0.03 + this.phaseNoise) * 0.1);
        
        // Calculate 3D position with proper B-DNA geometry plus entropy
        const x = width / 2 + Math.cos(totalRotation) * breathingRadius;
        const y = height / 2 + this.baseY + this.yNoise + Math.sin(time * 0.02 + this.phaseNoise) * 3;
        const z = Math.sin(totalRotation) * breathingRadius;
        
        // Apply base inclination with some wobble
        const inclinedY = y + Math.sin(totalRotation) * Math.sin(INCLINATION) * 5;
        
        return {
          x, 
          y: inclinedY, 
          z,
          size: this.size,
          opacity: this.opacity,
          strand: this.strand,
          bpIndex: this.bpIndex,
          rotation: totalRotation,
          entropy: this.entropy,
          connections: this.connections
        };
      }
    }

    class BasePair {
      constructor(bpIndex) {
        this.bpIndex = bpIndex;
        this.baseY = (bpIndex - numBasePairs / 2) * RISE_PER_BP;
        this.size = random(3, 5);
        this.opacity = random(120, 160);
        // Simulate different base pair types (A-T, G-C)
        this.type = random() > 0.6 ? 'GC' : 'AT'; // GC pairs are less common but stronger
        this.strength = this.type === 'GC' ? random(0.7, 1.0) : random(0.4, 0.8); // Variable bond strength
        this.bondPhase = random(0, TWO_PI); // For bond fluctuation
        this.isConnected = true; // Dynamic connection state
        this.reconnectionTimer = 0;
      }

      update(time) {
        const rotation = this.bpIndex * ROTATION_PER_BP + time * animationSpeed;
        
        // Dynamic bond breaking and forming (entropy)
        this.reconnectionTimer += 1;
        const bondStability = this.type === 'GC' ? 0.98 : 0.95; // GC bonds more stable
        
        if (this.isConnected && random() > bondStability) {
          this.isConnected = false;
          this.reconnectionTimer = 0;
        } else if (!this.isConnected && this.reconnectionTimer > random(30, 80)) {
          this.isConnected = true;
          this.reconnectionTimer = 0;
        }
        
        // Add bond fluctuation
        const bondFluctuation = Math.sin(time * 0.05 + this.bondPhase) * 0.1 + 1;
        
        // Calculate positions for both bases in the pair
        const x1 = width / 2 + Math.cos(rotation) * HELIX_RADIUS;
        const x2 = width / 2 + Math.cos(rotation + Math.PI) * HELIX_RADIUS;
        const y = height / 2 + this.baseY;
        const z1 = Math.sin(rotation) * HELIX_RADIUS;
        const z2 = Math.sin(rotation + Math.PI) * HELIX_RADIUS;
        
        // Apply propeller twist to base pairs with fluctuation
        const propellerOffset = Math.sin(PROPELLER_TWIST) * 3 * bondFluctuation;
        
        return {
          x1, y, z1,
          x2, y: y + propellerOffset, z2,
          size: this.size,
          opacity: this.opacity,
          type: this.type,
          bpIndex: this.bpIndex,
          strength: this.strength * bondFluctuation,
          isConnected: this.isConnected
        };
      }
    }

    // Initialize particles based on B-DNA structure
    for (let i = 0; i < numBasePairs; i++) {
      backboneParticles1.push(new BackboneParticle(i, 1));
      backboneParticles2.push(new BackboneParticle(i, 2));
      basePairs.push(new BasePair(i));
    }

    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const animate = (currentTime) => {
      if (!lastFrameTime) {
        lastFrameTime = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameInterval) {
        const remainder = deltaTime % frameInterval;
        lastFrameTime = currentTime - remainder;

        ctx.fillStyle = '#F0EEE6';
        ctx.fillRect(0, 0, width, height);

        time += 1;

        // Update all particles
        const backbone1Points = backboneParticles1.map(p => p.update(time));
        const backbone2Points = backboneParticles2.map(p => p.update(time));
        const basePairPoints = basePairs.map(p => p.update(time));
        
        allPoints = [...backbone1Points, ...backbone2Points];
        allPoints.sort((a, b) => a.z - b.z);

        // Clear old connections
        backbone1Points.forEach(p => p.connections.clear());
        backbone2Points.forEach(p => p.connections.clear());

        // Draw entropic connections between nearby particles (like original)
        ctx.lineWidth = 1;
        for (let i = 0; i < allPoints.length; i++) {
          const p1 = allPoints[i];
          for (let j = i + 1; j < allPoints.length; j++) {
            const p2 = allPoints[j];
            const d = dist(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            
            // Random connections form and break (entropy from original)
            if (d < 80 && random() > 0.7) {
              const opacity = map(d, 0, 80, 0.3, 0.05) * map(Math.min(p1.z, p2.z), -HELIX_RADIUS, HELIX_RADIUS, 0.3, 1);
              ctx.strokeStyle = `rgba(60, 60, 60, ${opacity})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
              
              p1.connections.add(j);
              p2.connections.add(i);
            }
          }
        }

        // Draw base pairs (hydrogen bonds) with dynamic behavior
        ctx.lineWidth = 1.5;
        basePairPoints.forEach(bp => {
          if (bp.isConnected) {
            const depthFactor = map(Math.min(bp.z1, bp.z2), -HELIX_RADIUS, HELIX_RADIUS, 0.3, 1);
            const opacity = (bp.opacity / 255) * depthFactor * bp.strength;
            
            // Draw base pair connection with fluctuation
            ctx.strokeStyle = `rgba(80, 40, 120, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(bp.x1, bp.y);
            ctx.lineTo(bp.x2, bp.y);
            ctx.stroke();
          }
          
          // Draw individual bases (always present even when bonds break)
          const baseSize = bp.size * map(Math.min(bp.z1, bp.z2), -HELIX_RADIUS, HELIX_RADIUS, 0.8, 1.3);
          const baseOpacity = (bp.opacity / 255) * map(Math.min(bp.z1, bp.z2), -HELIX_RADIUS, HELIX_RADIUS, 0.4, 1);
          const baseColor = bp.type === 'GC' ? 'rgba(120, 60, 40, ' : 'rgba(60, 120, 40, ';
          
          ctx.fillStyle = baseColor + baseOpacity + ')';
          ctx.beginPath();
          ctx.arc(bp.x1, bp.y, baseSize / 2, 0, TWO_PI);
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(bp.x2, bp.y, baseSize / 2, 0, TWO_PI);
          ctx.fill();
        });

        // Draw sugar-phosphate backbone connections with some entropy
        ctx.lineWidth = 2;
        [backbone1Points, backbone2Points].forEach((backbonePoints, strandIndex) => {
          const strandColor = strandIndex === 0 ? 'rgba(200, 100, 50, ' : 'rgba(50, 100, 200, ';
          
          for (let i = 0; i < backbonePoints.length - 1; i++) {
            const p1 = backbonePoints[i];
            const p2 = backbonePoints[i + 1];
            
            // Only connect adjacent base pairs in sequence, but with some random breaks
            if (Math.abs(p1.bpIndex - p2.bpIndex) === 1 && random() > 0.05) {
              const depthFactor = map(Math.min(p1.z, p2.z), -HELIX_RADIUS, HELIX_RADIUS, 0.4, 1);
              const opacity = 0.6 * depthFactor * (0.7 + random() * 0.3); // Add some opacity variation
              
              ctx.strokeStyle = strandColor + opacity + ')';
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        });

        // Draw phosphate groups (backbone particles) with size variation
        allPoints.forEach(point => {
          const sizeMultiplier = map(point.z, -HELIX_RADIUS, HELIX_RADIUS, 0.7, 1.4) * (0.8 + random() * 0.4);
          const adjustedOpacity = map(point.z, -HELIX_RADIUS, HELIX_RADIUS, point.opacity * 0.5, point.opacity);
          
          const strandColor = point.strand === 1 ? 'rgba(180, 80, 30, ' : 'rgba(30, 80, 180, ';
          ctx.fillStyle = strandColor + (adjustedOpacity / 255) + ')';
          ctx.beginPath();
          ctx.arc(point.x, point.y, (point.size * sizeMultiplier) / 2, 0, TWO_PI);
          ctx.fill();
        });

        // Draw flowing connections between distant particles (original style entropy)
        ctx.lineWidth = 0.8;
        for (let i = 0; i < allPoints.length; i++) {
          const p1 = allPoints[i];
          if (random() > 0.95) { // Very random, sparse connections
            for (let j = 0; j < allPoints.length; j++) {
              if (i !== j) {
                const p2 = allPoints[j];
                const d = dist(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
                if (d < 150 && random() > 0.8) {
                  const opacity = map(d, 0, 150, 0.2, 0.02) * map(Math.min(p1.z, p2.z), -HELIX_RADIUS, HELIX_RADIUS, 0.2, 0.8);
                  ctx.strokeStyle = `rgba(40, 40, 40, ${opacity})`;
                  ctx.beginPath();
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.stroke();
                }
              }
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (canvas && ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F0EEE6] flex flex-col items-center justify-center">
      <div className="border-0 overflow-hidden">
        <canvas ref={canvasRef} width={800} height={600} />
      </div>
    </div>
  );
};

export default DoubleHelixArtwork;
