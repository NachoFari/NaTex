/**
 * NaTex Studio - 32x32 Pixel-Art Theme Atmosphere Effects Engine
 * Renders authentic, high-detail 32x32 pixel-art atmospheric particles onto
 * an offscreen canvas pool and animates them with theme-tailored physics.
 * 
 * Supports all 21 NaTex themes:
 *   fox, rabbit, sakura, unicorn, coffee, mushroom, owl, frog,
 *   penguin, panda, bee, wolf, lion, octopus, whale, cosmos,
 *   bat, dino, maple, panther, custom
 */

(function() {
    'use strict';

    // =========================================================================
    // COLOR HELPERS
    // =========================================================================

    function adjustColor(hex, factor) {
        if (!hex || typeof hex !== 'string') hex = '#FF6B35';
        hex = hex.replace('#', '').trim();
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length !== 6) hex = 'FF6B35';
        const num = parseInt(hex, 16);
        let r = (num >> 16) & 255;
        let g = (num >> 8) & 255;
        let b = num & 255;

        if (factor > 0) {
            r = Math.min(255, Math.round(r + (255 - r) * factor));
            g = Math.min(255, Math.round(g + (255 - g) * factor));
            b = Math.min(255, Math.round(b + (255 - b) * factor));
        } else {
            const mult = 1 + factor;
            r = Math.max(0, Math.round(r * mult));
            g = Math.max(0, Math.round(g * mult));
            b = Math.max(0, Math.round(b * mult));
        }
        return `rgb(${r},${g},${b})`;
    }

    // =========================================================================
    // 32x32 SPRITE BUILDER
    // =========================================================================

    function patternToCanvas(rows, palette) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d', { alpha: true });
        ctx.imageSmoothingEnabled = false;

        const h = rows.length;
        const w = rows[0].length;
        const offsetX = Math.floor((32 - w) / 2);
        const offsetY = Math.floor((32 - h) / 2);

        for (let y = 0; y < h; y++) {
            const row = rows[y];
            for (let x = 0; x < row.length; x++) {
                const ch = row[x];
                if (ch !== ' ' && palette[ch]) {
                    ctx.fillStyle = palette[ch];
                    ctx.fillRect(offsetX + x, offsetY + y, 1, 1);
                }
            }
        }
        return canvas;
    }

    // =========================================================================
    // PIXEL-ART SPRITE DEFINITIONS FOR ALL THEMES (32x32)
    // =========================================================================

    const SPRITE_BUILDERS = {
        // --- 1. SAKURA (Cherry Blossom) ---
        sakura: [
            // Variant 0: 5-Petal Sakura Blossom
            () => patternToCanvas([
                "       ####        ####       ",
                "     #pppppp#    #pppppp#     ",
                "    #ppllllpp#  #ppllllpp#    ",
                "   #ppllwwllpp##ppllwwllpp#   ",
                "   #ppllwwllppppppllwwllpp#   ",
                "    #ppllllppdooobppllllpp#   ",
                "     #ppppppdoooyodbpppppp#   ",
                "      ####doyyyyyyod####      ",
                "     #ppppdoooyyyodppppp#     ",
                "   #ppllllppdooobppllllpp#    ",
                "  #ppllwwllpp####ppllwwllpp#  ",
                "  #ppllwwllppppppllwwllpp#    ",
                "   #ppllllpp#    #ppllllpp#   ",
                "    #pppppp#  ##  #pppppp#    ",
                "      ####  #pppp#  ####      ",
                "           #ppllpp#           ",
                "          #ppllwwll#          ",
                "          #ppllwwll#          ",
                "           #ppllpp#           ",
                "             ####             "
            ], {
                '#': '#9f1239',
                'p': '#f472b6',
                'l': '#fbcfe8',
                'w': '#fff1f2',
                'd': '#be185d',
                'o': '#ea580c',
                'y': '#fde047',
                'b': '#fb7185'
            }),
            // Variant 1: Falling Sakura Petal
            () => patternToCanvas([
                "      ####      ",
                "    #ppllpp#    ",
                "   #ppllwwll#   ",
                "  #ppllwwwwll#  ",
                "  #ppllwwwwll#  ",
                "  #ppllllwwll#  ",
                "   #ppllllpp#   ",
                "    #ppllpp#    ",
                "     #pppp#     ",
                "      #pp#      ",
                "       ##       "
            ], {
                '#': '#9f1239',
                'p': '#f472b6',
                'l': '#fbcfe8',
                'w': '#ffffff'
            }),
            // Variant 2: Fluttering Twin Petals
            () => patternToCanvas([
                "    ####            ",
                "   #ppll#     ####  ",
                "  #ppllww#   #ppll# ",
                "  #ppllww#  #pllww# ",
                "   #ppll#   #pllww# ",
                "    ####     #ppll# ",
                "              ####  "
            ], {
                '#': '#be185d',
                'p': '#f472b6',
                'l': '#fbcfe8',
                'w': '#fff1f2'
            })
        ],

        // --- 2. FOX (Classic Fox) ---
        fox: [
            // Variant 0: Glowing Autumn Fox Leaf
            () => patternToCanvas([
                "          ##          ",
                "         #yy#         ",
                "        #yaay#        ",
                "       #yaffay#       ",
                "      #yaffffay#      ",
                "     #yaffffffay#     ",
                "    #yafffyyfffay#    ",
                "    #oaffyyyyffao#    ",
                "   #oafffyyyyfffao#   ",
                "   #oaffffyyffffao#   ",
                "    #oafffyyfffao#    ",
                "    ##oaffyyffao##    ",
                "     ##oafyyao##      ",
                "       ##oyyo##       ",
                "        #oyyo#        ",
                "         #yy#         ",
                "         #yy#         ",
                "          ##          "
            ], {
                '#': '#7c2d12',
                'o': '#c2410c',
                'a': '#ea580c',
                'f': '#ff6b35',
                'y': '#fbbf24'
            }),
            // Variant 1: Warm Campfire Ember Spark
            () => patternToCanvas([
                "       ##       ",
                "      #ff#      ",
                "     #faaf#     ",
                "    #faayya#    ",
                "   #faaywwya#   ",
                "    #faayya#    ",
                "     #faaf#     ",
                "      #ff#      ",
                "       ##       "
            ], {
                '#': '#7c2d12',
                'f': '#ea580c',
                'a': '#fb923c',
                'y': '#fde047',
                'w': '#ffffff'
            }),
            // Variant 2: Autumn Ember Whirl
            () => patternToCanvas([
                "    ##          ",
                "   #ff#   ##    ",
                "  #fyyf# #ff#   ",
                "  #fwwf# #fyf#  ",
                "   #ff#   #ff#  ",
                "    ##          "
            ], {
                '#': '#7c2d12',
                'f': '#ff6b35',
                'y': '#fde047',
                'w': '#ffffff'
            })
        ],

        // --- 3. RABBIT (Cotton Rabbit) ---
        rabbit: [
            // Variant 0: Cute Pastel Heart
            () => patternToCanvas([
                "   ####    ####   ",
                "  #bbbb#  #bbbb#  ",
                " #bllllb##bllllb# ",
                "#bllwwllbbllwwllb#",
                "#bllwwllbbllwwllb#",
                "#bllllllllllllllb#",
                " #bllllllllllllb# ",
                "  #bllllllllllb#  ",
                "   #bllllllllb#   ",
                "    #bllllllb#    ",
                "     #bllllb#     ",
                "      #bllb#      ",
                "       #bb#       ",
                "        ##        "
            ], {
                '#': '#9d174d',
                'b': '#ec4899',
                'l': '#f472b6',
                'w': '#ffffff'
            }),
            // Variant 1: Fluffy Cotton Cloud
            () => patternToCanvas([
                "        ####            ",
                "      #bllll#   ####    ",
                "    #bllwwllb# #llll#   ",
                "   #bllwwwwllb#llwwll#  ",
                "  #bllwwwwwwwwbllwwllb# ",
                "  #bllllllllllllllllllb#",
                "   #bbbbbbbbbbbbbbbbbb# "
            ], {
                '#': '#94a3b8',
                'b': '#cbd5e1',
                'l': '#f1f5f9',
                'w': '#ffffff'
            }),
            // Variant 2: Tiny Cute Carrot
            () => patternToCanvas([
                "     ## ##     ",
                "    #gg#gg#    ",
                "     #ggg#     ",
                "    #ooooo#    ",
                "   #oooyyoo#   ",
                "   #ooyyyoo#   ",
                "    #ooyoo#    ",
                "     #ooo#     ",
                "      #o#      ",
                "       #       "
            ], {
                '#': '#15803d',
                'g': '#22c55e',
                'o': '#ea580c',
                'y': '#fde047'
            })
        ],

        // --- 4. UNICORN (Pastel Unicorn) ---
        unicorn: [
            // Variant 0: 4-Point Magical Starlight
            () => patternToCanvas([
                "          ##          ",
                "         #vv#         ",
                "         #vv#         ",
                "        #vmmv#        ",
                "        #vmmv#        ",
                "       #vmwwmv#       ",
                "  #### #vmwwmv# ####  ",
                " #vvvv##vmwwmv##vvvv# ",
                "#vmmmmmmmwwwwmmmmmmmv#",
                "#vmmmmmmmwwwwmmmmmmmv#",
                " #vvvv##vmwwmv##vvvv# ",
                "  #### #vmwwmv# ####  ",
                "       #vmwwmv#       ",
                "        #vmmv#        ",
                "        #vmmv#        ",
                "         #vv#         ",
                "         #vv#         ",
                "          ##          "
            ], {
                '#': '#6b21a8',
                'v': '#a855f7',
                'm': '#e879f9',
                'w': '#ffffff'
            }),
            // Variant 1: Prism Crystal Gem
            () => patternToCanvas([
                "      ######      ",
                "    ##cccccc##    ",
                "   #ccmwwwmcc#    ",
                "  #ccmwwwwwwmcc#  ",
                "  #vvmmmmmmmmvv#  ",
                "   #vvvmmmmvvv#   ",
                "    #vvvvvvvv#    ",
                "     #vvvvvv#     ",
                "      #vvvv#      ",
                "       #vv#       ",
                "        ##        "
            ], {
                '#': '#581c87',
                'c': '#38bdf8',
                'm': '#c084fc',
                'v': '#9333ea',
                'w': '#ffffff'
            }),
            // Variant 2: Pastel Sparkle
            () => patternToCanvas([
                "     ##     ",
                "    #mm#    ",
                "  ##mwwm##  ",
                " #mmwwwwmm# ",
                "  ##mwwm##  ",
                "    #mm#    ",
                "     ##     "
            ], {
                '#': '#7e22ce',
                'm': '#e879f9',
                'w': '#ffffff'
            })
        ],

        // --- 5. COFFEE (Autumn Coffee) ---
        coffee: [
            // Variant 0: Roasted Coffee Bean
            () => patternToCanvas([
                "      ######      ",
                "    ##bbbbbb##    ",
                "   #bbrmmmmrbb#   ",
                "  #brmmaaccammrb# ",
                " #brmacc###ccamrb#",
                "#brmacc#bbbccamrb#",
                "#brmacc#bbbccamrb#",
                " #brmacc###ccamrb#",
                "  #brmmaaccammrb# ",
                "   #bbrmmmmrbb#   ",
                "    ##bbbbbb##    ",
                "      ######      "
            ], {
                '#': '#271206',
                'b': '#451a03',
                'r': '#78350f',
                'm': '#92400e',
                'a': '#d97706',
                'c': '#1c0d02'
            }),
            // Variant 1: Warm Steam Aroma Swirl
            () => patternToCanvas([
                "      ####      ",
                "     #yyyy#     ",
                "    #yywwyy#    ",
                "     #yyww#     ",
                "      #yy#      ",
                "     #yy#       ",
                "    #yy#        ",
                "   #yyww#       ",
                "   #yywwyy#     ",
                "    #yyyy#      "
            ], {
                '#': '#b45309',
                'y': '#fef3c7',
                'w': '#ffffff'
            }),
            // Variant 2: Cinnamon Star
            () => patternToCanvas([
                "    #    #    ",
                "   #b#  #b#   ",
                "  #bb####bb#  ",
                "   #baaaab#   ",
                "####aywwya####",
                "   #baaaab#   ",
                "  #bb####bb#  ",
                "   #b#  #b#   ",
                "    #    #    "
            ], {
                '#': '#451a03',
                'b': '#92400e',
                'a': '#d97706',
                'y': '#f59e0b',
                'w': '#fef3c7'
            })
        ],

        // --- 6. MUSHROOM (Cottagecore Forest) ---
        mushroom: [
            // Variant 0: Red-Capped Toadstool
            () => patternToCanvas([
                "        ######        ",
                "      ##rrrrrr##      ",
                "    ##rrwwrrrrrr##    ",
                "   #rrrwwwwrrrrwwr#   ",
                "  #rrrrwwwwrrrwwwwr#  ",
                " #rrrrrrwwrrrrwwwwrr# ",
                "#rrrrrrrrrrrrrrwwrrrr#",
                "######################",
                "      #ssssss#        ",
                "      #syyyygs#       ",
                "      #syyyygs#       ",
                "      #syyyygs#       ",
                "      #ssssss#        ",
                "       ######         "
            ], {
                '#': '#450a0a',
                'r': '#dc2626',
                'w': '#ffffff',
                's': '#fef08a',
                'y': '#fef9c3',
                'g': '#ca8a04'
            }),
            // Variant 1: Glowing Forest Spore
            () => patternToCanvas([
                "      ####      ",
                "    #gggggg#    ",
                "   #ggyyyygg#   ",
                "  #gyywwwwyyg#  ",
                "  #gyywwwwyyg#  ",
                "   #ggyyyygg#   ",
                "    #gggggg#    ",
                "      ####      "
            ], {
                '#': '#14532d',
                'g': '#22c55e',
                'y': '#fef08a',
                'w': '#ffffff'
            }),
            // Variant 2: Woodland Fern Frond
            () => patternToCanvas([
                "     ##     ",
                "    #gg#    ",
                "   #gggg#   ",
                "  #gg##gg#  ",
                " #gg#  #gg# ",
                "  ##    ##  "
            ], {
                '#': '#14532d',
                'g': '#4ade80'
            })
        ],

        // --- 7. OWL (Academic Owl) ---
        owl: [
            // Variant 0: Golden Quill Feather
            () => patternToCanvas([
                "          ##          ",
                "         #yy#         ",
                "        #yyyy#        ",
                "       #yy##yy#       ",
                "      #yy#yy#yy#      ",
                "     #yy#yyyy#yy#     ",
                "    #yy#yy##yy#yy#    ",
                "     #yy#yyyy#yy#     ",
                "      #yy#yy#yy#      ",
                "       #yy##yy#       ",
                "        #yyyy#        ",
                "         #yy#         ",
                "          ##          "
            ], {
                '#': '#78350f',
                'y': '#fbbf24'
            }),
            // Variant 1: Crescent Moon
            () => patternToCanvas([
                "     ######     ",
                "   ##yyyyyy#    ",
                "  #yyyyyyyyy#   ",
                " #yyyy###yyyy#  ",
                " #yyy#   #yyy#  ",
                "#yyy#     #yy#  ",
                "#yyy#      ##   ",
                "#yyy#           ",
                " #yyy#          ",
                " #yyyy#         ",
                "  #yyyyy##      ",
                "   ##yyyyyy#    ",
                "     ######     "
            ], {
                '#': '#1e3a8a',
                'y': '#fef08a'
            }),
            // Variant 2: Twinkling Wisdom Star
            () => patternToCanvas([
                "     ##     ",
                "    #yy#    ",
                "  ##ywwy##  ",
                " #yywwwwyy# ",
                "  ##ywwy##  ",
                "    #yy#    ",
                "     ##     "
            ], {
                '#': '#78350f',
                'y': '#fbbf24',
                'w': '#ffffff'
            })
        ],

        // --- 8. FROG (Matcha Zen Frog) ---
        frog: [
            // Variant 0: Glowing Firefly
            () => patternToCanvas([
                "      ####      ",
                "     #bbbb#     ",
                "    #bwwwwb#    ",
                "   #wwbbbbww#   ",
                "   #wyyyyyyw#   ",
                "    #yyyyyy#    ",
                "     #yyyy#     ",
                "      ####      "
            ], {
                '#': '#064e3b',
                'b': '#10b981',
                'w': '#a7f3d0',
                'y': '#fde047'
            }),
            // Variant 1: Lotus Lilypad Leaf
            () => patternToCanvas([
                "      ######      ",
                "    ##gggggg##    ",
                "   #gggg##gggg#   ",
                "  #ggg##  ##ggg#  ",
                " #gggg#    #gggg# ",
                " #gggg#    #gggg# ",
                "  #gggg#  #gggg#  ",
                "   #gggg##gggg#   ",
                "    ##gggggg##    ",
                "      ######      "
            ], {
                '#': '#065f46',
                'g': '#10b981'
            }),
            // Variant 2: Zen Water Drop
            () => patternToCanvas([
                "     ##     ",
                "    #cc#    ",
                "   #cccc#   ",
                "  #ccwwcc#  ",
                "  #ccwwcc#  ",
                "   #cccc#   ",
                "    ####    "
            ], {
                '#': '#047857',
                'c': '#34d399',
                'w': '#ffffff'
            })
        ],

        // --- 9. PENGUIN (Glacier Penguin) ---
        penguin: [
            // Variant 0: Crystalline Snowflake
            () => patternToCanvas([
                "       #       #       ",
                "      #c#     #c#      ",
                "   #   #c#   #c#   #   ",
                "  #c#   #c# #c#   #c#  ",
                "   #c#   #c#c#   #c#   ",
                "    #c# #ccccc# #c#    ",
                "#####c#ccwwwwwcc#c#####",
                " #ccccccccwwwcccccccc# ",
                "#####c#ccwwwwwcc#c#####",
                "    #c# #ccccc# #c#    ",
                "   #c#   #c#c#   #c#   ",
                "  #c#   #c# #c#   #c#  ",
                "   #   #c#   #c#   #   ",
                "      #c#     #c#      ",
                "       #       #       "
            ], {
                '#': '#0891b2',
                'c': '#06b6d4',
                'w': '#ffffff'
            }),
            // Variant 1: Ice Crystal Diamond
            () => patternToCanvas([
                "      ####      ",
                "    ##cccc##    ",
                "   #ccwwwwcc#   ",
                "  #cccwwwwccc#  ",
                "  #cccccccccc#  ",
                "   #cccccccc#   ",
                "    #cccccc#    ",
                "     #cccc#     ",
                "      #cc#      ",
                "       ##       "
            ], {
                '#': '#0e7490',
                'c': '#67e8f9',
                'w': '#ffffff'
            }),
            // Variant 2: Arctic Frost Twinkle
            () => patternToCanvas([
                "     #     ",
                "    #c#    ",
                "  ##cwc##  ",
                " #ccwwwcc# ",
                "  ##cwc##  ",
                "    #c#    ",
                "     #     "
            ], {
                '#': '#0891b2',
                'c': '#67e8f9',
                'w': '#ffffff'
            })
        ],

        // --- 10. PANDA (Bamboo Panda) ---
        panda: [
            // Variant 0: Bamboo Leaf Cluster
            () => patternToCanvas([
                "             ##       ",
                "            #gg#      ",
                "           #gggg#     ",
                "   ##     #gggggg#    ",
                "  #gg#   #gggggggg#   ",
                " #gggg# #ggggg##gg#   ",
                "#gggggg##gggg#  ##    ",
                " #gggggggggg#         ",
                "  #gggggggg#          ",
                "   ##gggg#            ",
                "     ##               "
            ], {
                '#': '#365314',
                'g': '#84cc16'
            }),
            // Variant 1: Zen Wind Swirl
            () => patternToCanvas([
                "      ######      ",
                "    ##gggggg##    ",
                "   #ggg####ggg#   ",
                "  #ggg#    #ggg#  ",
                "   ###      #gg#  ",
                "            #gg#  ",
                "           #ggg#  ",
                "          #ggg#   ",
                "         #ggg#    "
            ], {
                '#': '#4d7c0f',
                'g': '#bef264'
            }),
            // Variant 2: Bamboo Node Sprout
            () => patternToCanvas([
                "      ##      ",
                "     #gg#     ",
                "    #gggg#    ",
                "    #gwwg#    ",
                "    #gggg#    ",
                "     ####     "
            ], {
                '#': '#365314',
                'g': '#65a30d',
                'w': '#bef264'
            })
        ],

        // --- 11. BEE (Golden Bee) ---
        bee: [
            // Variant 0: Honeycomb Hexagon
            () => patternToCanvas([
                "      ######      ",
                "    ##yyyyyy##    ",
                "   #yyyyyyyyyy#   ",
                "  #yyywwyyyyyyy#  ",
                " #yyywwwwyyyyyyy# ",
                " #yyywwwwyyyyyyy# ",
                "  #yyywwyyyyyyy#  ",
                "   #yyyyyyyyyy#   ",
                "    ##yyyyyy##    ",
                "      ######      "
            ], {
                '#': '#78350f',
                'y': '#f59e0b',
                'w': '#fef08a'
            }),
            // Variant 1: Cute Striped Honeybee
            () => patternToCanvas([
                "      ##  ##      ",
                "     #cc##cc#     ",
                "    #cccccccc#    ",
                "   #kkkkyyyykk#   ",
                "  #kkkkyyyyyykk#  ",
                " #kkkkyyyyyyyykk# ",
                " #kkkkyyyyyyyykk# ",
                "  #kkkkyyyyyykk#  ",
                "   #kkkkyyyykk#   ",
                "        ##        "
            ], {
                '#': '#451a03',
                'k': '#1c1917',
                'y': '#fde047',
                'c': '#bae6fd'
            }),
            // Variant 2: Golden Pollen Sparkle
            () => patternToCanvas([
                "     ##     ",
                "    #yy#    ",
                "  ##ywwy##  ",
                " #yywwwwyy# ",
                "  ##ywwy##  ",
                "    #yy#    ",
                "     ##     "
            ], {
                '#': '#78350f',
                'y': '#f59e0b',
                'w': '#ffffff'
            })
        ],

        // --- 12. WOLF (Arctic Wolf) ---
        wolf: [
            // Variant 0: Arctic Frost Shard
            () => patternToCanvas([
                "       #       ",
                "      #b#      ",
                "     #bbb#     ",
                "     #bwb#     ",
                "    #bbwbb#    ",
                "    #bbwbb#    ",
                "   #bbbwbbb#   ",
                "   #bbbwbbb#   ",
                "  #bbbbwbbbb#  ",
                "  #bbbbwbbbb#  ",
                " #bbbbbwbbbbb# ",
                "       #       "
            ], {
                '#': '#1e3a8a',
                'b': '#60a5fa',
                'w': '#ffffff'
            }),
            // Variant 1: Aurora Borealis Star
            () => patternToCanvas([
                "       #       ",
                "      #c#      ",
                "     #ccc#     ",
                " #  #ccccc#  # ",
                "#c##ccwwwcc##c#",
                " #ccwwwwwwwcc# ",
                "#c##ccwwwcc##c#",
                " #  #ccccc#  # ",
                "     #ccc#     ",
                "      #c#      ",
                "       #       "
            ], {
                '#': '#0284c7',
                'c': '#34d399',
                'w': '#ffffff'
            }),
            // Variant 2: Snow Blizzard Flurry
            () => patternToCanvas([
                "    ##          ",
                "   #bb#   ##    ",
                "  #bwwb# #bb#   ",
                "  #bwwb# #bwb#  ",
                "   #bb#   #bb#  ",
                "    ##          "
            ], {
                '#': '#1e3a8a',
                'b': '#93c5fd',
                'w': '#ffffff'
            })
        ],

        // --- 13. LION (Solar Lion) ---
        lion: [
            // Variant 0: Solar Flare Sunburst
            () => patternToCanvas([
                "       #       #       ",
                "      #o#     #o#      ",
                "   #   #o#   #o#   #   ",
                "  #o#   #o# #o#   #o#  ",
                "   #o# #ooooooo# #o#   ",
                "    #ooyyyyyyyoo#o#    ",
                "#####oyywwwwwyyo#####",
                " #oooyywwwwwwwyyooo# ",
                "#####oyywwwwwyyo#####",
                "    #ooyyyyyyyoo#o#    ",
                "   #o# #ooooooo# #o#   ",
                "  #o#   #o# #o#   #o#  ",
                "   #   #o#   #o#   #   ",
                "      #o#     #o#      ",
                "       #       #       "
            ], {
                '#': '#7c2d12',
                'o': '#ea580c',
                'y': '#eab308',
                'w': '#ffffff'
            }),
            // Variant 1: Golden Regal Crown
            () => patternToCanvas([
                "#      #      #",
                "#y#   #y#   #y#",
                "#yy# #yyy# #yy#",
                "#yyyyyyyyyyyyy#",
                "#yyyrryyyrryyy#",
                "#yyyyyyyyyyyyy#",
                "###############"
            ], {
                '#': '#78350f',
                'y': '#eab308',
                'r': '#dc2626'
            }),
            // Variant 2: Solar Spark
            () => patternToCanvas([
                "     ##     ",
                "    #yy#    ",
                "  ##ywwy##  ",
                " #yywwwwyy# ",
                "  ##ywwy##  ",
                "    #yy#    ",
                "     ##     "
            ], {
                '#': '#78350f',
                'y': '#fde047',
                'w': '#ffffff'
            })
        ],

        // --- 14. OCTOPUS (Synthwave Octopus) ---
        octopus: [
            // Variant 0: Synthwave Neon Diamond
            () => patternToCanvas([
                "         #         ",
                "        #c#        ",
                "       #ccc#       ",
                "      #ccmcc#      ",
                "     #ccmmmcc#     ",
                "    #ccmmwmmcc#    ",
                "   #ccmmwwwmmcc#   ",
                "    #ccmmwmmcc#    ",
                "     #ccmmmcc#     ",
                "      #ccmcc#      ",
                "       #ccc#       ",
                "        #c#        ",
                "         #         "
            ], {
                '#': '#0891b2',
                'c': '#22d3ee',
                'm': '#e879f9',
                'w': '#ffffff'
            }),
            // Variant 1: Retro Pixel Music Note
            () => patternToCanvas([
                "        ####        ",
                "       #cccc#       ",
                "       #cccc#       ",
                "       #cccc#       ",
                "       #cccc#       ",
                "       #cccc#       ",
                "     ###cccc#       ",
                "    #mmm#ccc#       ",
                "   #mmwmm#cc#       ",
                "   #mmwmm###        ",
                "    #mmm#           ",
                "     ###            "
            ], {
                '#': '#0e7490',
                'c': '#22d3ee',
                'm': '#f43f5e',
                'w': '#ffffff'
            }),
            // Variant 2: Cyber Grid Bubble
            () => patternToCanvas([
                "      ####      ",
                "    ##cccc##    ",
                "   #cc#mm#cc#   ",
                "  #cc##mm##cc#  ",
                "  #mmmmmmmmmm#  ",
                "  #cc##mm##cc#  ",
                "   #cc#mm#cc#   ",
                "    ##cccc##    ",
                "      ####      "
            ], {
                '#': '#0891b2',
                'c': '#22d3ee',
                'm': '#e879f9'
            })
        ],

        // --- 15. WHALE (Abyssal Whale) ---
        whale: [
            // Variant 0: Glossy Water Bubble
            () => patternToCanvas([
                "      ######      ",
                "    ##bbbbbb##    ",
                "   #bbwwbbbbbb#   ",
                "  #bbwwwwbbbbbb#  ",
                " #bbwwbbbbbbbbbb# ",
                " #bbbbbbbbbbbbbb# ",
                "  #bbbbbbbbbbbb#  ",
                "   #bbbbbbbbbb#   ",
                "    ##bbbbbb##    ",
                "      ######      "
            ], {
                '#': '#0369a1',
                'b': '#38bdf8',
                'w': '#ffffff'
            }),
            // Variant 1: Bioluminescent Jellyfish
            () => patternToCanvas([
                "      ######      ",
                "    ##jjjjjj##    ",
                "   #jjwwwwwwjj#   ",
                "  #jjjjjjjjjjjj#  ",
                "  #jjjjjjjjjjjj#  ",
                "  ##############  ",
                "   #j# #j# #j#    ",
                "   #j# #j# #j#    ",
                "   #j#  #   #j#   ",
                "    #        #    "
            ], {
                '#': '#312e81',
                'j': '#818cf8',
                'w': '#c7d2fe'
            }),
            // Variant 2: Deep Sea Plankton Star
            () => patternToCanvas([
                "     ##     ",
                "    #bb#    ",
                "  ##bwwb##  ",
                " #bbwwwwbb# ",
                "  ##bwwb##  ",
                "    #bb#    ",
                "     ##     "
            ], {
                '#': '#0369a1',
                'b': '#38bdf8',
                'w': '#ffffff'
            })
        ],

        // --- 16. COSMOS (Stellar Cosmos) ---
        cosmos: [
            // Variant 0: Ringed Planet Saturn
            () => patternToCanvas([
                "               ####               ",
                "             ##vvvv##             ",
                "           ##vvwwwwvv##           ",
                "         ##vvwwwwwwwwvv##         ",
                "    #####vvwwwwwwwwwwwwvv#####    ",
                "  ##rrrrrvvwwwwwwwwwwwwvvrrrrr##  ",
                " #rrrrrrrrrvvwwwwwwwwvvrrrrrrrrr# ",
                "#rrrrrrrrrrrrvvvvvvvvrrrrrrrrrrrr#",
                " #rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr# ",
                "  ##rrrrrrrrrrrrrrrrrrrrrrrrrr##  ",
                "    ##########################    "
            ], {
                '#': '#3b0764',
                'v': '#7c3aed',
                'w': '#c4b5fd',
                'r': '#f472b6'
            }),
            // Variant 1: Shooting Star Meteor
            () => patternToCanvas([
                "             ## ",
                "            #yy#",
                "          ##ywwy",
                "        ##yywwyy",
                "      ##yywwyy##",
                "    ##mmwwmm##  ",
                "  ##mmwwmm##    ",
                "##vvwwvv##      ",
                "##vvvv##        "
            ], {
                '#': '#4c1d95',
                'y': '#fde047',
                'w': '#ffffff',
                'm': '#f472b6',
                'v': '#8b5cf6'
            }),
            // Variant 2: Nebula Nova Crystal
            () => patternToCanvas([
                "       #       ",
                "      #v#      ",
                "     #vmv#     ",
                " #  #vmmmv#  # ",
                "#v##vmwwwmv##v#",
                " #vmwwwwwwwmv# ",
                "#v##vmwwwmv##v#",
                " #  #vmmmv#  # ",
                "     #vmv#     ",
                "      #v#      ",
                "       #       "
            ], {
                '#': '#3b0764',
                'v': '#8b5cf6',
                'm': '#f472b6',
                'w': '#ffffff'
            })
        ],

        // --- 17. BAT (Gothic Bat) ---
        bat: [
            // Variant 0: Gothic Bat Wings Spread
            () => patternToCanvas([
                "#              #",
                "##            ##",
                "#k#          #k#",
                "#kk#   ##   #kk#",
                "#kkk# #ee# #kkk#",
                "#kkkk##kk##kkkk#",
                "#kkkkkkkkkkkkkk#",
                " #kkkkk##kkkkk# ",
                "  #kkk#  #kkk#  ",
                "   ###    ###   "
            ], {
                '#': '#1e1b4b',
                'k': '#4c0519',
                'e': '#fb7185'
            }),
            // Variant 1: Crimson Rose Petal
            () => patternToCanvas([
                "      ####      ",
                "    #rrkkrr#    ",
                "   #rrkkwkrr#   ",
                "  #rrkkwwwwkrr# ",
                "  #rrkkwwwwkrr# ",
                "   #rrkkwkrr#   ",
                "    #rrkkrr#    ",
                "      ####      "
            ], {
                '#': '#4c0519',
                'r': '#881337',
                'k': '#e11d48',
                'w': '#fb7185'
            }),
            // Variant 2: Blood-Moon Crescent
            () => patternToCanvas([
                "     ######     ",
                "   ##rrrrrr#    ",
                "  #rrrrrrrrr#   ",
                " #rrrr###rrrr#  ",
                " #rrr#   #rrr#  ",
                "#rrr#     #rr#  ",
                "#rrr#      ##   ",
                "#rrr#           ",
                " #rrr#          ",
                " #rrrr#         ",
                "  #rrrrr##      ",
                "   ##rrrrrr#    ",
                "     ######     "
            ], {
                '#': '#4c0519',
                'r': '#e11d48'
            })
        ],

        // --- 18. DINO (Retro Matrix Dino) ---
        dino: [
            // Variant 0: Matrix Terminal Glyph '0'/'1'
            () => patternToCanvas([
                "  ######  ",
                "  #gggg#  ",
                "  #g##g#  ",
                "  #g##g#  ",
                "  #gggg#  ",
                "  ######  ",
                "          ",
                "    ##    ",
                "   #gg#   ",
                "    #g#   ",
                "    #g#   ",
                "  ######  "
            ], {
                '#': '#052e16',
                'g': '#22c55e'
            }),
            // Variant 1: Pixel Dinosaur Footprint
            () => patternToCanvas([
                " #   #   # ",
                "#g# #g# #g#",
                "#g# #g# #g#",
                " #g##g##g# ",
                "  #ggggg#  ",
                "  #ggggg#  ",
                "   #ggg#   ",
                "    ###    "
            ], {
                '#': '#052e16',
                'g': '#4ade80'
            }),
            // Variant 2: Byte Code Glyph <>
            () => patternToCanvas([
                "  #    #  ",
                " #g#  #g# ",
                "#gg#  #gg#",
                " #g#  #g# ",
                "  #    #  "
            ], {
                '#': '#052e16',
                'g': '#86efac'
            })
        ],

        // --- 19. MAPLE (Autumn Maple) ---
        maple: [
            // Variant 0: Canadian Maple Leaf
            () => patternToCanvas([
                "         #         ",
                "        #r#        ",
                "       #rrr#       ",
                "   #  #rroorr#  #  ",
                "  #r##rroooorr##r# ",
                " #rrrroooooooorrrr#",
                "#rrrooooooyyoooorrr#",
                " #rrooooyyyyyooorr#",
                "  #ooyyyyyyyyyooy# ",
                "   #ooyyyyyyyyo#   ",
                "    #ooyyyyyo#     ",
                "     ##oyyo##      ",
                "       #yy#        ",
                "        ##         "
            ], {
                '#': '#7c2d12',
                'r': '#dc2626',
                'o': '#ea580c',
                'y': '#f97316'
            }),
            // Variant 1: Angled Spinning Autumn Leaf
            () => patternToCanvas([
                "      ##      ",
                "     #oo#     ",
                "    #ooaa#    ",
                "   #ooyyaao#  ",
                "  #ooyyyyyao# ",
                "   #ooyyaao#  ",
                "    #ooaa#    ",
                "     #oo#     ",
                "      ##      "
            ], {
                '#': '#7c2d12',
                'o': '#c2410c',
                'a': '#ea580c',
                'y': '#f97316'
            }),
            // Variant 2: Woodland Acorn
            () => patternToCanvas([
                "    ######    ",
                "   #cccccc#   ",
                "  #cccccccc#  ",
                "  ##########  ",
                "  #oooooooo#  ",
                "  #ooyyyyoo#  ",
                "   #ooyyoo#   ",
                "    #oooo#    ",
                "      ##      "
            ], {
                '#': '#451a03',
                'c': '#78350f',
                'o': '#d97706',
                'y': '#fef08a'
            })
        ],

        // --- 20. PANTHER (OLED Panther) ---
        panther: [
            // Variant 0: Sleek Silver Diamond Star
            () => patternToCanvas([
                "         #         ",
                "        #s#        ",
                "       #sss#       ",
                "      #sswss#      ",
                "     #sswwwss#     ",
                "    #sswwwwwss#    ",
                "   #sswwwwwwwss#   ",
                "    #sswwwwwss#    ",
                "     #sswwwss#     ",
                "      #sswss#      ",
                "       #sss#       ",
                "        #s#        ",
                "         #         "
            ], {
                '#': '#0f172a',
                's': '#94a3b8',
                'w': '#ffffff'
            }),
            // Variant 1: Stealthy Feline Paw Glint
            () => patternToCanvas([
                " #   #   # ",
                "#s# #s# #s#",
                " #   #   # ",
                "   #####   ",
                "  #sssss#  ",
                " #sswwwss# ",
                "  #sssss#  ",
                "   #####   "
            ], {
                '#': '#1e293b',
                's': '#94a3b8',
                'w': '#ffffff'
            }),
            // Variant 2: Crescent Blade Sheen
            () => patternToCanvas([
                "     ######     ",
                "   ##ssssss#    ",
                "  #sssssssss#   ",
                " #ssss###ssss#  ",
                " #sss#   #sss#  ",
                "#sss#     #ss#  ",
                "#sss#      ##   ",
                "#sss#           ",
                " #sss#          ",
                " #ssss#         ",
                "  #sssss##      ",
                "   ##ssssss#    ",
                "     ######     "
            ], {
                '#': '#0f172a',
                's': '#e2e8f0'
            })
        ]
    };

    // Dynamic builder for "custom" theme
    function createCustomSprites(colorHex) {
        if (!colorHex) colorHex = '#FF6B35';
        const dark = adjustColor(colorHex, -0.6);
        const base = colorHex;
        const mid = adjustColor(colorHex, 0.35);
        const light = adjustColor(colorHex, 0.75);
        const white = '#ffffff';

        const palette = {
            '#': dark,
            'b': base,
            'm': mid,
            'l': light,
            'w': white
        };

        return [
            // Variant 0: Dynamic 4-Point Crystal Star
            patternToCanvas([
                "          ##          ",
                "         #bb#         ",
                "         #bb#         ",
                "        #bmmb#        ",
                "        #bmmb#        ",
                "       #bmwwmb#       ",
                "  #### #bmwwmb# ####  ",
                " #bbbb##bmwwmb##bbbb# ",
                "#bmmmmmmmwwwwmmmmmmmb#",
                "#bmmmmmmmwwwwmmmmmmmb#",
                " #bbbb##bmwwmb##bbbb# ",
                "  #### #bmwwmb# ####  ",
                "       #bmwwmb#       ",
                "        #bmmb#        ",
                "        #bmmb#        ",
                "         #bb#         ",
                "         #bb#         ",
                "          ##          "
            ], palette),
            // Variant 1: Dynamic Gemstone Prism
            patternToCanvas([
                "      ######      ",
                "    ##bbbbbb##    ",
                "   #bbmwwwmbb#    ",
                "  #bbmwwwwwwmbb#  ",
                "  #llmmmmmmmmll#  ",
                "   #lllmmmmlll#   ",
                "    #llllllll#    ",
                "     #llllll#     ",
                "      #llll#      ",
                "       #ll#       ",
                "        ##        "
            ], palette),
            // Variant 2: Dynamic Ambient Sparkle
            patternToCanvas([
                "     ##     ",
                "    #mm#    ",
                "  ##mwwm##  ",
                " #mmwwwwmm# ",
                "  ##mwwm##  ",
                "    #mm#    ",
                "     ##     "
            ], palette)
        ];
    }

    // =========================================================================
    // THEME PHYSICS PROFILES
    // =========================================================================

    const THEME_PHYSICS = {
        sakura:   { dir: 'fall', vy: [0.6, 1.3], vx: [0.2, 0.8], rot: 0.015, amp: 1.2 },
        fox:      { dir: 'rise', vy: [-0.6, -1.2], vx: [-0.3, 0.3], rot: 0.01, amp: 0.7 },
        rabbit:   { dir: 'fall', vy: [0.5, 1.1], vx: [-0.3, 0.3], rot: 0.012, amp: 1.0 },
        unicorn:  { dir: 'float', vy: [-0.3, 0.5], vx: [-0.4, 0.4], rot: 0.008, amp: 0.8 },
        coffee:   { dir: 'rise', vy: [-0.5, -1.1], vx: [-0.2, 0.4], rot: 0.008, amp: 0.9 },
        mushroom: { dir: 'float', vy: [-0.4, 0.6], vx: [-0.4, 0.4], rot: 0.01, amp: 0.8 },
        owl:      { dir: 'fall', vy: [0.5, 1.0], vx: [-0.3, 0.5], rot: 0.01, amp: 1.0 },
        frog:     { dir: 'float', vy: [-0.4, 0.4], vx: [-0.5, 0.5], rot: 0.006, amp: 1.1 },
        penguin:  { dir: 'fall', vy: [0.8, 1.6], vx: [-0.4, 0.6], rot: 0.012, amp: 0.6 },
        panda:    { dir: 'fall', vy: [0.6, 1.2], vx: [0.3, 0.9], rot: 0.018, amp: 1.3 },
        bee:      { dir: 'float', vy: [-0.5, 0.5], vx: [-0.6, 0.6], rot: 0.02, amp: 1.4 },
        wolf:     { dir: 'fall', vy: [0.7, 1.5], vx: [-0.5, 0.7], rot: 0.01, amp: 0.7 },
        lion:     { dir: 'rise', vy: [-0.5, -1.0], vx: [-0.3, 0.3], rot: 0.012, amp: 0.8 },
        octopus:  { dir: 'float', vy: [-0.4, 0.4], vx: [-0.5, 0.5], rot: 0.015, amp: 1.0 },
        whale:    { dir: 'rise', vy: [-0.6, -1.4], vx: [-0.3, 0.3], rot: 0.005, amp: 1.0 },
        cosmos:   { dir: 'float', vy: [-0.2, 0.4], vx: [-0.3, 0.3], rot: 0.006, amp: 0.7 },
        bat:      { dir: 'float', vy: [-0.3, 0.6], vx: [-0.6, 0.6], rot: 0.015, amp: 1.2 },
        dino:     { dir: 'fall', vy: [1.2, 2.2], vx: [0, 0.1], rot: 0, amp: 0.2 },
        maple:    { dir: 'fall', vy: [0.7, 1.4], vx: [0.4, 0.9], rot: 0.02, amp: 1.4 },
        panther:  { dir: 'float', vy: [-0.3, 0.5], vx: [-0.4, 0.4], rot: 0.008, amp: 0.6 },
        custom:   { dir: 'float', vy: [-0.3, 0.5], vx: [-0.4, 0.4], rot: 0.01, amp: 0.8 }
    };

    // =========================================================================
    // ENGINE STATE & CACHE
    // =========================================================================

    const SPRITE_CACHE = {};
    let customSpritesCache = null;
    let lastCustomColor = null;

    let canvasEl = null;
    let ctx = null;
    let animationFrameId = null;
    let isRunning = false;

    let activeTheme = 'fox';
    let currentCustomColor = '#FF6B35';
    let effectsEnabled = true;
    let effectsFrequency = 100; // 20% to 200%, default 100%

    const BASE_PARTICLE_COUNT = 22;
    const particles = [];

    function getTargetParticleCount() {
        return Math.max(3, Math.round(BASE_PARTICLE_COUNT * (effectsFrequency / 100)));
    }

    function getSpeedMultiplier() {
        return 0.72 + 0.28 * (effectsFrequency / 100);
    }

    function formatFrequencyBadge(freq) {
        const isEn = (typeof currentLanguage !== 'undefined' && currentLanguage === 'en') ||
                     (localStorage.getItem('natex_language') === 'en');
        let label = isEn ? 'Normal' : 'Normal';
        if (freq <= 40) label = isEn ? 'Very Low' : 'Muy baja';
        else if (freq <= 70) label = isEn ? 'Low' : 'Baja';
        else if (freq <= 120) label = isEn ? 'Normal' : 'Normal';
        else if (freq <= 160) label = isEn ? 'High' : 'Alta';
        else label = isEn ? 'Intense' : 'Intensa';
        return `${label} (${freq}%)`;
    }

    function syncFrequencyUI() {
        const rangeEl = document.getElementById('rangeThemeEffectsFreq');
        if (rangeEl && parseInt(rangeEl.value, 10) !== effectsFrequency) {
            rangeEl.value = String(effectsFrequency);
        }
        const lblEl = document.getElementById('lblThemeEffectsFreqVal');
        if (lblEl) {
            lblEl.textContent = formatFrequencyBadge(effectsFrequency);
        }
        const freqRow = document.getElementById('themeEffectsFreqRow');
        if (freqRow) {
            freqRow.style.opacity = effectsEnabled ? '1' : '0.45';
            freqRow.style.pointerEvents = effectsEnabled ? 'auto' : 'none';
        }
    }

    // =========================================================================
    // SPRITE CACHE RESOLVER
    // =========================================================================

    function getThemeSprites(themeId) {
        let t = (themeId || 'fox').toLowerCase().trim();
        if (t === 'dark') t = 'fox';
        if (t === 'light') t = 'rabbit';

        if (t === 'custom') {
            const color = currentCustomColor || '#FF6B35';
            if (!customSpritesCache || lastCustomColor !== color) {
                customSpritesCache = createCustomSprites(color);
                lastCustomColor = color;
            }
            return customSpritesCache;
        }

        if (SPRITE_CACHE[t]) {
            return SPRITE_CACHE[t];
        }

        if (SPRITE_BUILDERS[t]) {
            SPRITE_CACHE[t] = SPRITE_BUILDERS[t].map(fn => fn());
            return SPRITE_CACHE[t];
        }

        // Fallback to fox
        if (!SPRITE_CACHE['fox'] && SPRITE_BUILDERS['fox']) {
            SPRITE_CACHE['fox'] = SPRITE_BUILDERS['fox'].map(fn => fn());
        }
        return SPRITE_CACHE['fox'] || [];
    }

    // =========================================================================
    // PARTICLE MANAGEMENT
    // =========================================================================

    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function createParticle(initialScatter = true) {
        const physics = THEME_PHYSICS[activeTheme] || THEME_PHYSICS['fox'];
        const sprites = getThemeSprites(activeTheme);
        const w = canvasEl ? canvasEl.width : window.innerWidth;
        const h = canvasEl ? canvasEl.height : window.innerHeight;

        let x = Math.random() * w;
        let y = initialScatter ? Math.random() * h : (physics.dir === 'rise' ? h + randomRange(10, 40) : -randomRange(10, 40));

        return {
            x: x,
            y: y,
            vx: randomRange(physics.vx[0], physics.vx[1]),
            vy: randomRange(physics.vy[0], physics.vy[1]),
            scale: randomRange(0.75, 1.25),
            angle: Math.random() * Math.PI * 2,
            vAngle: randomRange(-physics.rot, physics.rot),
            alpha: randomRange(0.65, 0.95),
            waveTimer: Math.random() * Math.PI * 2,
            waveSpeed: randomRange(0.015, 0.04),
            waveAmp: physics.amp * randomRange(0.6, 1.4),
            spriteIdx: Math.floor(Math.random() * (sprites.length || 1))
        };
    }

    function initParticles() {
        particles.length = 0;
        const targetCount = getTargetParticleCount();
        for (let i = 0; i < targetCount; i++) {
            particles.push(createParticle(true));
        }
    }

    function adjustParticlePoolSize() {
        const targetCount = getTargetParticleCount();
        while (particles.length < targetCount) {
            particles.push(createParticle(true));
        }
        if (particles.length > targetCount) {
            particles.length = targetCount;
        }
    }

    function resetParticle(p) {
        const physics = THEME_PHYSICS[activeTheme] || THEME_PHYSICS['fox'];
        const sprites = getThemeSprites(activeTheme);
        const w = canvasEl ? canvasEl.width : window.innerWidth;
        const h = canvasEl ? canvasEl.height : window.innerHeight;

        p.x = Math.random() * w;
        if (physics.dir === 'rise') {
            p.y = h + randomRange(15, 50);
        } else if (physics.dir === 'fall') {
            p.y = -randomRange(15, 50);
        } else {
            // float / drift randomly around perimeter or surface
            p.y = Math.random() < 0.5 ? -randomRange(10, 30) : h + randomRange(10, 30);
        }

        p.vx = randomRange(physics.vx[0], physics.vx[1]);
        p.vy = randomRange(physics.vy[0], physics.vy[1]);
        p.scale = randomRange(0.75, 1.25);
        p.angle = Math.random() * Math.PI * 2;
        p.vAngle = randomRange(-physics.rot, physics.rot);
        p.alpha = randomRange(0.65, 0.95);
        p.waveTimer = Math.random() * Math.PI * 2;
        p.waveSpeed = randomRange(0.015, 0.04);
        p.waveAmp = physics.amp * randomRange(0.6, 1.4);
        p.spriteIdx = Math.floor(Math.random() * (sprites.length || 1));
    }

    // =========================================================================
    // ANIMATION LOOP
    // =========================================================================

    function step() {
        if (!isRunning || !effectsEnabled) return;

        if (!canvasEl || !ctx) {
            setupCanvas();
            if (!canvasEl || !ctx) {
                animationFrameId = requestAnimationFrame(step);
                return;
            }
        }

        // Skip heavy drawing if document is hidden to conserve power
        if (document.hidden) {
            animationFrameId = requestAnimationFrame(step);
            return;
        }

        const w = canvasEl.width;
        const h = canvasEl.height;

        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = false;

        const sprites = getThemeSprites(activeTheme);
        if (!sprites || sprites.length === 0) {
            animationFrameId = requestAnimationFrame(step);
            return;
        }

        const physics = THEME_PHYSICS[activeTheme] || THEME_PHYSICS['fox'];
        const speedMult = getSpeedMultiplier();

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.waveTimer += p.waveSpeed * speedMult;
            p.x += (p.vx + Math.sin(p.waveTimer) * p.waveAmp) * speedMult;
            p.y += p.vy * speedMult;
            p.angle += p.vAngle * speedMult;

            // Boundaries check
            const pad = 40;
            if (physics.dir === 'rise' && p.y < -pad) {
                resetParticle(p);
            } else if (physics.dir === 'fall' && p.y > h + pad) {
                resetParticle(p);
            } else if (p.y < -pad || p.y > h + pad) {
                resetParticle(p);
            }

            if (p.x < -pad) p.x = w + pad - 2;
            else if (p.x > w + pad) p.x = -pad + 2;

            const sprite = sprites[p.spriteIdx % sprites.length];
            if (!sprite) continue;

            const drawSize = 32 * p.scale;

            ctx.save();
            ctx.translate(Math.round(p.x), Math.round(p.y));
            if (p.angle !== 0) ctx.rotate(p.angle);
            ctx.globalAlpha = p.alpha;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.restore();
        }

        animationFrameId = requestAnimationFrame(step);
    }

    function startAnimation() {
        if (isRunning) return;
        isRunning = true;
        if (canvasEl) canvasEl.classList.remove('hidden');
        if (particles.length === 0) initParticles();
        animationFrameId = requestAnimationFrame(step);
    }

    function stopAnimation() {
        isRunning = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (ctx && canvasEl) {
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }
        if (canvasEl) {
            canvasEl.classList.add('hidden');
        }
    }

    // =========================================================================
    // CANVAS RESIZE & SETUP
    // =========================================================================

    function setupCanvas() {
        canvasEl = document.getElementById('natexThemeEffectsCanvas');
        if (!canvasEl) {
            canvasEl = document.createElement('canvas');
            canvasEl.id = 'natexThemeEffectsCanvas';
            canvasEl.setAttribute('aria-hidden', 'true');
            document.body.prepend(canvasEl);
        }

        ctx = canvasEl.getContext('2d', { alpha: true });
        if (ctx) ctx.imageSmoothingEnabled = false;

        resizeCanvas();
    }

    function resizeCanvas() {
        if (!canvasEl) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (canvasEl.width !== width || canvasEl.height !== height) {
            canvasEl.width = width;
            canvasEl.height = height;
            if (ctx) ctx.imageSmoothingEnabled = false;
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    function setThemeEffectsEnabled(enabled) {
        effectsEnabled = !!enabled;
        localStorage.setItem('natex_theme_effects', effectsEnabled ? 'true' : 'false');

        const chk = document.getElementById('chkThemeEffects');
        if (chk && chk.checked !== effectsEnabled) {
            chk.checked = effectsEnabled;
        }
        syncFrequencyUI();

        if (effectsEnabled) {
            startAnimation();
        } else {
            stopAnimation();
        }
    }

    function isThemeEffectsEnabled() {
        return effectsEnabled;
    }

    function setThemeEffectsFrequency(freq) {
        let num = parseInt(freq, 10);
        if (isNaN(num)) num = 100;
        effectsFrequency = Math.max(20, Math.min(200, num));
        localStorage.setItem('natex_theme_effects_freq', String(effectsFrequency));
        adjustParticlePoolSize();
        syncFrequencyUI();
    }

    function getThemeEffectsFrequency() {
        return effectsFrequency;
    }

    function updateThemeEffects(themeId, customColor) {
        let t = (themeId || activeTheme || 'fox').toLowerCase().trim();
        if (t === 'dark') t = 'fox';
        if (t === 'light') t = 'rabbit';

        if (customColor) {
            currentCustomColor = customColor;
            customSpritesCache = null; // force re-render with new custom color
        }

        activeTheme = t;

        // Smoothly adjust current particles towards the new theme's physics
        const physics = THEME_PHYSICS[activeTheme] || THEME_PHYSICS['fox'];
        const sprites = getThemeSprites(activeTheme);

        particles.forEach(p => {
            p.vx = randomRange(physics.vx[0], physics.vx[1]);
            p.vy = randomRange(physics.vy[0], physics.vy[1]);
            p.vAngle = randomRange(-physics.rot, physics.rot);
            p.waveAmp = physics.amp * randomRange(0.6, 1.4);
            p.spriteIdx = Math.floor(Math.random() * (sprites.length || 1));
        });

        if (effectsEnabled && !isRunning) {
            startAnimation();
        }
    }

    // Expose directly to window
    window.setThemeEffectsEnabled = setThemeEffectsEnabled;
    window.updateThemeEffects = updateThemeEffects;
    window.isThemeEffectsEnabled = isThemeEffectsEnabled;
    window.setThemeEffectsFrequency = setThemeEffectsFrequency;
    window.getThemeEffectsFrequency = getThemeEffectsFrequency;
    window.syncThemeEffectsFrequencyUI = syncFrequencyUI;

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    function init() {
        setupCanvas();
        window.addEventListener('resize', resizeCanvas, { passive: true });

        // Load stored preferences
        const stored = localStorage.getItem('natex_theme_effects');
        effectsEnabled = (stored !== 'false');

        const storedFreq = parseInt(localStorage.getItem('natex_theme_effects_freq') || '100', 10);
        if (!isNaN(storedFreq)) {
            effectsFrequency = Math.max(20, Math.min(200, storedFreq));
        }

        // Detect initial theme
        const docTheme = document.documentElement.getAttribute('data-theme') ||
                         localStorage.getItem('natex_theme') || 'fox';
        const docColor = localStorage.getItem('natex_custom_color') || '#FF6B35';
        currentCustomColor = docColor;
        activeTheme = docTheme.toLowerCase();
        if (activeTheme === 'dark') activeTheme = 'fox';
        if (activeTheme === 'light') activeTheme = 'rabbit';

        const chk = document.getElementById('chkThemeEffects');
        if (chk) {
            chk.checked = effectsEnabled;
            chk.onchange = (e) => setThemeEffectsEnabled(e.target.checked);
        }

        const rangeFreq = document.getElementById('rangeThemeEffectsFreq');
        if (rangeFreq) {
            rangeFreq.value = String(effectsFrequency);
            rangeFreq.oninput = (e) => setThemeEffectsFrequency(e.target.value);
        }

        syncFrequencyUI();

        if (effectsEnabled) {
            startAnimation();
        } else {
            stopAnimation();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
