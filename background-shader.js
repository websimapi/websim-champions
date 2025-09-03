// New file for the WebGL background shader
function initBackgroundShader() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) {
        console.error("Background canvas not found!");
        return;
    }

    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.warn("WebGL not supported, background shader will not be rendered.");
        return;
    }

    const vertexShaderSource = `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;

        // 2D Random function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        // 2D Noise function
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
        }

        // Fractal Brownian Motion
        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 0.0;
            for (int i = 0; i < 5; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        // Color palette function
        vec3 palette(float t) {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.00, 0.33, 0.67);
            return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y; // aspect ratio correction

            vec2 q = vec2(fbm(st + 0.00 * u_time * 0.1),
                          fbm(st + vec2(1.0)));

            vec2 r = vec2(fbm(q + 0.40 * u_time * 0.05),
                          fbm(q + vec2(1.2) + 0.30 * u_time * 0.08));

            float f = fbm(st + r);
            
            vec3 color = mix(vec3(0.101961, 0.0, 0.2), // Dark violet/blue
                             vec3(0.666667, 0.0, 0.0), // Deep red
                             clamp((f * f) * 2.0, 0.0, 1.0));

            color = mix(color,
                        vec3(0.8, 0.2, 0.0), // Orange
                        clamp(length(q), 0.0, 1.0));

            color = mix(color,
                        palette(length(r) + 0.5) * 0.5, // Add multi-color swirl
                        clamp(length(r.x), 0.0, 1.0));

            color = (f * f * f + 0.6 * f * f + 0.5 * f) * color;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) return shader;
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) return program;
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    const program = createProgram(gl, vertexShader, fragmentShader);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    function render(time) {
        time *= 0.001; // convert to seconds

        // Resize canvas if needed
        const displayWidth = gl.canvas.clientWidth;
        const displayHeight = gl.canvas.clientHeight;
        if (gl.canvas.width !== displayWidth || gl.canvas.height !== displayHeight) {
            gl.canvas.width = displayWidth;
            gl.canvas.height = displayHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeUniformLocation, time);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}