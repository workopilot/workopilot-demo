# -*- coding: utf-8 -*-
import sys

with open('index.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# The broken multi-line string
bad = "✅ 已收到全部2份住宿水单，附件齐全：\n\t- 如家精选酒店账单明细.jpg\n\t- 全季酒店住宿账单.jpg\n\t\n\t确认无误后，将为您生成差旅报销单待办卡片。'"

# The fixed single-line string with \n escapes
good = "✅ 已收到全部2份住宿水单，附件齐全：\\n- 如家精选酒店账单明细.jpg\\n- 全季酒店住宿账单.jpg\\n\\n确认无误后，将为您生成差旅报销单待办卡片。'"

if bad in content:
    content = content.replace(bad, good, 1)
    with open('index.vue', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')
else:
    print('NOT FOUND')
    # Find the broken text
    idx = content.find("✅ 已收到全部2份住宿水单")
    if idx >= 0:
        print(f'Found at position {idx}')
        print(repr(content[idx:idx+200]))
    else:
        print('Could not find the text at all')
        # Try to find the surrounding text
        idx = content.find("附件齐全")
        if idx >= 0:
            print(f'Found 附件齐全 at {idx}')
            print(repr(content[idx-20:idx+200]))