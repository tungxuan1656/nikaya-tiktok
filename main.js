import sharp from 'sharp'
import { createCanvas } from 'canvas'
import fs from 'fs'
// Function to wrap text based on actual width
const wrapText = (text, maxWidth, fontSize, fontFamily) => {
    const canvas = createCanvas(1, 1)
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px ${fontFamily}`

    const words = text.split(' ')
    const lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + ' ' + word).width
        if (width <= maxWidth) {
            currentLine += ' ' + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}

const createTextOverlay = async (part, title, content, footer) => {
    // Create SVG for title
    const titleSvg = Buffer.from(`
        <svg width="1080" height="1440">
            <text x="60" y="110" width="920" height="115" font-family="Montserrat" font-size="${Math.floor(
                (1080 / title.length) * 1.22,
            )}" font-weight="800">
                ${title}
            </text>
        </svg>
    `)

    // Process content with word wrapping
    const contentLines = content.split('\n')
    const wrappedLines = contentLines.flatMap((line) =>
        wrapText(line.trim(), 920, 28, 'Montserrat'),
    )
    const contentSvg = Buffer.from(`
        <svg width="1080" height="1440">
            <text x="60" y="210" font-family="Montserrat" font-size="28" font-weight="500" fill="black">
                ${wrappedLines
                    .map(
                        (line, index) =>
                            `<tspan x="60" dy="${index === 0 ? '0' : '1.7em'}">${line}</tspan>`,
                    )
                    .join('')}
            </text>
        </svg>
    `)

    // Create SVG for footer
    const footerSvg = Buffer.from(`
        <svg width="1080" height="1440">
            <text x="60" y="150" width="920" height="40" font-family="Montserrat" font-size="18" font-weight="700" font-style="italic">
                ${footer}
            </text>
        </svg>
    `)

    // Process the image with all text overlays
    const result = await sharp('bg.png')
        .composite([
            { input: titleSvg, top: 0, left: 0 },
            { input: contentSvg, top: 0, left: 0 },
            { input: footerSvg, top: 0, left: 0 },
        ])
        .toFile(`output/${part}/${part}.png`)

    return result
}

// Example usage
const main = async () => {
    const texts = fs.readFileSync('temp/content.txt', 'utf8').split('\n')
    const part = texts[0]
    const title = texts[1]
    const footer = texts[2]
    const content = texts.slice(3).join('\n')
    fs.mkdirSync(`output/${part}`, { recursive: true })
    fs.copyFileSync('temp/content.txt', `output/${part}/${part}.txt`)
    fs.copyFileSync('temp/audio.m4a', `output/${part}/${part}.m4a`)
    try {
        await createTextOverlay(part, title, content, footer)
        console.log('Image created successfully!')
    } catch (error) {
        console.error('Error creating image:', error)
    }
}

main()

