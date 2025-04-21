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
    const lengthTitle = title.length
    let isSplitTitle = false
    if (lengthTitle > 27) {
        isSplitTitle = true
    }
    // Split title into lines with max length of 27 characters per line
    let splitTitle = []
    if (isSplitTitle) {
        let words = title.split(' ')
        let currentLine = words[0]

        for (let i = 1; i < words.length; i++) {
            const word = words[i]
            if ((currentLine + ' ' + word).length <= 27) {
                currentLine += ' ' + word
            } else {
                splitTitle.push(currentLine)
                currentLine = word
            }
        }
        splitTitle.push(currentLine)
    } else {
        splitTitle = [title]
    }
    // Create SVG for title
    const titleSvg = Buffer.from(`
        <svg width="1080" height="1440">
            <text x="60" y="110" width="920" height="115" font-family="Montserrat" font-size="50" font-weight="800">
                ${splitTitle
                    .map(
                        (part, index) =>
                            `<tspan x="60" dy="${index === 0 ? '0' : '1.3em'}">${part}</tspan>`,
                    )
                    .join('')}
            </text>
        </svg>
    `)

    // Process content with word wrapping
    const contentLines = content.split('\n')
    let wrappedLines = contentLines.flatMap((line) => wrapText(line.trim(), 920, 28, 'Montserrat'))
    let fontSize = 28
    // Reduce font size until the number of wrapped lines is <= 25
    while (wrappedLines.length > 25 && fontSize > 18) {
        fontSize -= 1
        wrappedLines = contentLines.flatMap((line) =>
            wrapText(line.trim(), 920, fontSize, 'Montserrat'),
        )
    }
    const contentSvg = Buffer.from(`
        <svg width="1080" height="1440">
            <text x="60" y="${
                isSplitTitle ? '280' : '210'
            }" font-family="Montserrat" font-size="${fontSize}" font-weight="500" fill="black">
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
            <text x="60" y="${
                isSplitTitle ? '220' : '150'
            }" width="920" height="40" font-family="Montserrat" font-size="18" font-weight="700" font-style="italic">
                ${footer
                    .split(' ')
                    .filter((word) => !word.includes('#'))
                    .join(' ')}
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
    let content = texts.slice(3).join('\n')
    const lbIndex = texts.findIndex((line) => line.trim() === 'LỜI BÀN:')
    if (lbIndex !== -1) {
        content = texts.slice(3, lbIndex).join('\n')
    } else {
        content = texts.slice(3).join('\n')
    }
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

