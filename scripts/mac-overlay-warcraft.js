#!/usr/bin/env osascript -l JavaScript
// Warcraft 3 themed overlay notification for macOS
// Uses a wood/metal panel background image with gold text
// Usage: osascript -l JavaScript mac-overlay-warcraft.js <message> <color> <icon_path> <slot> <dismiss_seconds> [bundle_id] [ide_pid] [session_tty]

ObjC.import('Cocoa');
ObjC.import('QuartzCore');

function run(argv) {
  var message  = argv[0] || 'peon-ping';
  var color    = argv[1] || 'blue';
  var iconPath = argv[2] || '';
  var slot     = parseInt(argv[3], 10) || 0;
  var dismiss  = argv[4] !== undefined ? parseFloat(argv[4]) : 5;
  if (isNaN(dismiss)) dismiss = 5;
  var bundleId   = argv[5] || '';
  var idePid     = parseInt(argv[6], 10) || 0;
  var sessionTty  = argv[7] || '';
  var subtitle    = argv[8] || '';
  var position    = argv[9] || 'top-center';
  var notifType   = argv[10] || '';
  var allScreens  = argv[11] === 'true';
  var screenIdx   = (argv[12] !== undefined && argv[12] !== '') ? parseInt(argv[12], 10) : -1;

  // ── Pack detection from icon path ──
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var packName = '';
  if (iconPath) {
    var m = iconPath.match(/\/packs\/([^\/]+)\//);
    if (m) packName = m[1];
  }

  // ── Per-pack themed type labels + flavor quotes ──
  // Each pack has: { complete, permission, limit, idle, question }
  // with { label: "HEADER TEXT", quotes: [...] }
  var packs = {
    peasant: {
      complete:   { label: 'JOB\u2019S DONE',          quotes: ['Right-o.', 'Work complete.', 'All done, milord.', 'Ready to work.', 'More work?'] },
      permission: { label: 'ORDERS, MILORD?',           quotes: ['Yes, milord?', 'What is it?', 'Your command?', 'Say the word.'] },
      limit:      { label: 'WE\u2019RE UNDER ATTACK!',  quotes: ['That\u2019s it. I\u2019m dead.', 'Help! Help!', 'We need more resources!', 'We can\u2019t hold!'] },
      idle:       { label: 'STANDING AROUND\u2026',      quotes: ['Waiting on you, milord.', 'Are we there yet?', 'I\u2019m not doing anything\u2026'] },
      question:   { label: 'WHAT IS IT?',               quotes: ['Yes, milord?', 'What do you need?', 'Something on your mind?', 'Your command?'] },
      spam:       { label: 'STOP POKING ME!',           quotes: ['You\u2019re the king? Well I didn\u2019t vote for you.', 'Help! Help! I\u2019m being repressed!'] }
    },
    peon: {
      complete:   { label: 'WORK COMPLETE',             quotes: ['Ready to work!', 'Something need doing?', 'I can do that.', 'Okie dokie.'] },
      permission: { label: 'SOMETHING NEED DOING?',     quotes: ['What you want?', 'Say da magic word.', 'Hmmm?', 'Me busy. Leave me alone!'] },
      limit:      { label: 'ME NOT THAT KIND OF ORC!',  quotes: ['Why not?', 'Stop poking me!', 'Me busy!', 'That\u2019s it. I\u2019m dead.'] },
      idle:       { label: 'ZUG ZUG\u2026',             quotes: ['Me not that kind of orc!', 'What you want?', 'Whaaat?', 'Leave me alone!'] },
      question:   { label: 'WHAT YOU WANT?',            quotes: ['Something need doing?', 'Hmmm?', 'Say da magic word.', 'Me ready.'] },
      spam:       { label: 'STOP POKING ME!',           quotes: ['Me not that kind of orc!', 'Me busy! Leave me alone!', 'Whaaat?'] }
    },
    glados: {
      complete:   { label: 'TEST COMPLETE',             quotes: ['Oh, good. You\u2019re still alive.', 'Well done.', 'Good news.', 'Congratulations. Not.'] },
      permission: { label: 'AUTHORIZATION REQUIRED',    quotes: ['Unable to scan.', 'I\u2019m going to need you to cooperate.', 'Please proceed.'] },
      limit:      { label: 'CRITICAL ERROR',            quotes: ['Because I\u2019m a potato.', 'Oh, one sec! It ain\u2019t working.', 'This is troubling.'] },
      idle:       { label: 'ARE YOU STILL THERE?',      quotes: ['Hello?', 'I see you.', 'Still alive\u2026', 'Could you come over here?'] },
      question:   { label: 'INPUT REQUIRED',            quotes: ['I\u2019m going to need an answer.', 'Please respond.', 'Waiting on your input.'] },
      spam:       { label: 'SERIOUSLY?',                quotes: ['Where did your life go so wrong?', 'You\u2019re not a good person.', 'This is your fault.'] }
    },
    sc_battlecruiser: {
      complete:   { label: 'MISSION ACCOMPLISHED',      quotes: ['Hailing frequencies open.', 'Battlecruiser operational.', 'All systems nominal.'] },
      permission: { label: 'AWAITING ORDERS',           quotes: ['Identify yourself.', 'Standing by.', 'Receiving transmission\u2026'] },
      limit:      { label: 'SHIELDS CRITICAL',          quotes: ['We\u2019re taking heavy fire!', 'Hull breach detected!', 'Abandon ship!'] },
      idle:       { label: 'HOLDING POSITION',          quotes: ['Make it happen.', 'Set a course.', 'I really have to go\u2026'] },
      question:   { label: 'INCOMING TRANSMISSION',     quotes: ['Identify yourself.', 'Channel open.', 'Go ahead.'] },
      spam:       { label: 'COMM CHANNEL OVERLOAD',     quotes: ['I really have to go.', 'Take it slow.', 'In the pipe, five by five.'] }
    },
    sc_kerrigan: {
      complete:   { label: 'EVOLUTION COMPLETE',        quotes: ['I\u2019m ready.', 'It\u2019s done.', 'Mission accomplished.', 'Lieutenant Kerrigan reporting.'] },
      permission: { label: 'WHAT NOW?',                 quotes: ['What now?', 'I gotcha.', 'I\u2019m listening.', 'Go ahead.'] },
      limit:      { label: 'THE SWARM HUNGERS',         quotes: ['Ugh!', 'This isn\u2019t over!', 'We\u2019ve been compromised!'] },
      idle:       { label: 'STANDING BY\u2026',          quotes: ['Easily amused, huh?', 'I\u2019m waiting.', 'What now?'] },
      question:   { label: 'AWAITING INPUT',            quotes: ['What now?', 'I gotcha.', 'Go ahead.', 'I\u2019m listening.'] },
      spam:       { label: 'YOU\u2019RE PUSHING IT',     quotes: ['Easily amused, huh?', 'Knock it off.', 'Quit it.'] }
    }
  };

  // Resolve pack data (fallback to peasant, then generic)
  var pd = packs[packName] || packs['peasant'] || {};

  var typeText, flavorText;
  var typeKey;
  switch (notifType) {
    case 'complete':   typeKey = 'complete';   break;
    case 'permission': typeKey = 'permission'; break;
    case 'limit':      typeKey = 'limit';      break;
    case 'idle':       typeKey = 'idle';       break;
    case 'question':   typeKey = 'question';   break;
    default:
      if (color === 'blue') typeKey = 'complete';
      else if (color === 'red' || color === 'yellow') typeKey = 'limit';
      else typeKey = 'question';
  }

  var entry = pd[typeKey] || { label: typeKey.toUpperCase(), quotes: ['...'] };
  typeText = entry.label;
  flavorText = pick(entry.quotes);

  // Use flavor text as message if the message is just a project name or generic
  if (!message || message === 'peon-ping' || message.indexOf('/') !== -1) {
    message = flavorText;
  }

  // ── Accent colors (gold tints per notification type) ──
  var accentR, accentG, accentB;
  switch (color) {
    case 'red':    accentR=0.90; accentG=0.30; accentB=0.20; break;
    case 'yellow': accentR=0.95; accentG=0.75; accentB=0.20; break;
    case 'green':  accentR=0.40; accentG=0.85; accentB=0.35; break;
    case 'blue': default: accentR=0.83; accentG=0.68; accentB=0.21; break; // gold
  }

  // ── Window dimensions ──
  var winW = 420, winH = 180;
  var padX = 0, padY = 0;

  // ── NSApp setup ──
  $.NSApplication.sharedApplication;
  $.NSApp.setActivationPolicy($.NSApplicationActivationPolicyAccessory);

  var slotForNotification = parseInt(argv[3], 10) || 0;
  var dismissNotificationName = 'com.peonping.dismiss.warcraft.' + slotForNotification;

  // ── Screen detection ──
  var screens = $.NSScreen.screens;
  var targetScreen;
  if (screenIdx >= 0 && screenIdx < screens.count) {
    targetScreen = screens.objectAtIndex(screenIdx);
  } else {
    var mouseLocation = $.NSEvent.mouseLocation;
    targetScreen = screens.objectAtIndex(0);
    for (var s = 0; s < screens.count; s++) {
      var scr = screens.objectAtIndex(s);
      var sf = scr.frame;
      if (mouseLocation.x >= sf.origin.x && mouseLocation.x <= sf.origin.x + sf.size.width &&
          mouseLocation.y >= sf.origin.y && mouseLocation.y <= sf.origin.y + sf.size.height) {
        targetScreen = scr; break;
      }
    }
  }

  var vf = targetScreen.visibleFrame;
  var margin = 10;
  var slotStep = winH + 8;
  var ySlotOffset = margin + slot * slotStep;
  var x, y;
  switch (position) {
    case 'top-right':
      x = vf.origin.x + vf.size.width - winW - margin;
      y = vf.origin.y + vf.size.height - winH - ySlotOffset;
      break;
    case 'top-left':
      x = vf.origin.x + margin;
      y = vf.origin.y + vf.size.height - winH - ySlotOffset;
      break;
    case 'bottom-right':
      x = vf.origin.x + vf.size.width - winW - margin;
      y = vf.origin.y + ySlotOffset;
      break;
    case 'bottom-left':
      x = vf.origin.x + margin;
      y = vf.origin.y + ySlotOffset;
      break;
    case 'bottom-center':
      x = vf.origin.x + (vf.size.width - winW) / 2;
      y = vf.origin.y + ySlotOffset;
      break;
    default: // top-center
      x = vf.origin.x + (vf.size.width - winW) / 2;
      y = vf.origin.y + vf.size.height - winH - ySlotOffset;
  }

  // ── Window ──
  var win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
    $.NSMakeRect(x, y, winW, winH),
    $.NSWindowStyleMaskBorderless, $.NSBackingStoreBuffered, false
  );
  win.setBackgroundColor($.NSColor.clearColor);
  win.setOpaque(false); win.setHasShadow(true); win.setAlphaValue(0.0);
  win.setLevel($.NSStatusWindowLevel);
  win.setCollectionBehavior($.NSWindowCollectionBehaviorCanJoinAllSpaces | $.NSWindowCollectionBehaviorStationary);
  win.contentView.wantsLayer = true;

  function cg(r,g,b,a) { return $.NSColor.colorWithSRGBRedGreenBlueAlpha(r,g,b,a).CGColor; }

  // ══════════════════════════════════════════════
  // BACKGROUND IMAGE
  // ══════════════════════════════════════════════
  // Resolve path to warcraft-bg.png relative to this script
  var procArgs = $.NSProcessInfo.processInfo.arguments;
  var scriptDir = '';
  for (var ai = 0; ai < procArgs.count; ai++) {
    var a = ObjC.unwrap(procArgs.objectAtIndex(ai));
    if (a.indexOf('mac-overlay-warcraft.js') !== -1) {
      scriptDir = ObjC.unwrap($(a).stringByDeletingLastPathComponent);
      break;
    }
  }
  var bgImagePath = scriptDir + '/warcraft-bg.png';

  var bgImage = $.NSImage.alloc.initWithContentsOfFile($(bgImagePath));
  if (bgImage && !bgImage.isNil()) {
    var bgView = $.NSImageView.alloc.initWithFrame($.NSMakeRect(0, 0, winW, winH));
    bgView.setImage(bgImage);
    bgView.setImageScaling($.NSImageScaleAxesIndependently);
    bgView.setImageAlignment($.NSImageAlignCenter);
    win.contentView.addSubview(bgView);
  } else {
    // Fallback: dark brown fill if image not found
    var fallbackView = $.NSView.alloc.initWithFrame($.NSMakeRect(0, 0, winW, winH));
    fallbackView.setWantsLayer(true);
    fallbackView.layer.setBackgroundColor(cg(0.15, 0.10, 0.06, 0.95));
    win.contentView.addSubview(fallbackView);
  }

  // ══════════════════════════════════════════════
  // PACK ICON (peasant portrait)
  // ══════════════════════════════════════════════
  var iconSize = 52;
  var iconX = 36;
  var iconY = (winH - iconSize) / 2;
  var textX = iconX + iconSize + 18; // text starts after icon
  var textMaxW = winW - textX - 36;

  if (iconPath) {
    var iconImage = $.NSImage.alloc.initWithContentsOfFile($(iconPath));
    if (iconImage && !iconImage.isNil()) {
      var iconView = $.NSImageView.alloc.initWithFrame($.NSMakeRect(iconX, iconY, iconSize, iconSize));
      iconView.setImage(iconImage);
      iconView.setImageScaling($.NSImageScaleProportionallyUpOrDown);
      iconView.setImageAlignment($.NSImageAlignCenter);
      // Gold border around icon
      iconView.setWantsLayer(true);
      iconView.layer.setBorderWidth(2.0);
      iconView.layer.setBorderColor(cg(0.83, 0.68, 0.21, 0.9));
      iconView.layer.setCornerRadius(4.0);
      win.contentView.addSubview(iconView);
    }
  }

  // ══════════════════════════════════════════════
  // TEXT — gold on dark wood
  // ══════════════════════════════════════════════
  function makeLabel(text, xPos, yPos, w, fontSize, fontName, r, g, b, alpha) {
    var font = $.NSFont.fontWithNameSize(fontName, fontSize);
    if (!font || font.isNil()) font = $.NSFont.boldSystemFontOfSize(fontSize);
    var label = $.NSTextField.alloc.initWithFrame($.NSMakeRect(xPos, yPos, w, 30));
    label.setStringValue($(text)); label.setBezeled(false); label.setDrawsBackground(false);
    label.setEditable(false); label.setSelectable(false);
    label.setTextColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(r, g, b, alpha));
    label.setFont(font); label.sizeToFit;
    return label;
  }

  // Type label (e.g. "TASK COMPLETE") — Copperplate, bright gold
  win.contentView.addSubview(makeLabel(
    typeText, textX, winH - 52, textMaxW, 14,
    'Copperplate-Bold', accentR, accentG, accentB, 0.95
  ));

  // Message — Palatino, parchment white
  var msgFontName = 'Palatino-Roman', msgFontSize = 16;
  var msgFont = $.NSFont.fontWithNameSize(msgFontName, msgFontSize);
  if (!msgFont || msgFont.isNil()) msgFont = $.NSFont.systemFontOfSize(msgFontSize);
  var tmp = $.NSTextField.alloc.initWithFrame($.NSMakeRect(0, 0, 400, 20));
  tmp.setFont(msgFont); tmp.setBezeled(false);

  var words = message.split(' '), lines = [], curLine = '';
  for (var wi = 0; wi < words.length; wi++) {
    var test = curLine ? curLine + ' ' + words[wi] : words[wi];
    tmp.setStringValue($(test)); tmp.sizeToFit;
    if (tmp.frame.size.width > textMaxW && curLine) {
      lines.push(curLine); curLine = words[wi];
    } else { curLine = test; }
  }
  if (curLine) lines.push(curLine);

  var lineH = 20;
  var topLineY = winH - 70;
  for (var li = 0; li < lines.length; li++) {
    var yPos = topLineY - li * lineH;
    win.contentView.addSubview(makeLabel(
      lines[li], textX, yPos, textMaxW, msgFontSize, msgFontName,
      0.92, 0.87, 0.72, 0.95  // warm parchment
    ));
  }

  // Context subtitle
  if (subtitle) {
    var subFontSize = 12, subFontName = 'Palatino-Italic';
    var subFont = $.NSFont.fontWithNameSize(subFontName, subFontSize);
    if (!subFont || subFont.isNil()) subFont = $.NSFont.systemFontOfSize(subFontSize);
    var subTmp = $.NSTextField.alloc.initWithFrame($.NSMakeRect(0,0,400,20));
    subTmp.setFont(subFont); subTmp.setBezeled(false);
    var subWords = subtitle.split(' '), subLines = [], subCur = '';
    for (var sw=0; sw<subWords.length; sw++) {
      var subTest = subCur ? subCur + ' ' + subWords[sw] : subWords[sw];
      subTmp.setStringValue($(subTest)); subTmp.sizeToFit;
      if (subTmp.frame.size.width > textMaxW - 20 && subCur) {
        subLines.push(subCur); subCur = subWords[sw];
      } else { subCur = subTest; }
    }
    if (subCur) subLines.push(subCur);
    if (subLines.length > 2) subLines = [subLines[0], subLines[1] + '...'];
    var subLineH = 13;
    var subTopY = topLineY - lines.length * lineH - 3;
    for (var sl=0; sl<subLines.length; sl++) {
      var subYPos = subTopY - sl * subLineH;
      win.contentView.addSubview(makeLabel(
        subLines[sl], textX, subYPos, textMaxW, subFontSize, subFontName,
        0.75, 0.70, 0.55, 0.6
      ));
    }
  }

  // Timestamp — dim gold, Copperplate small
  var now = new Date();
  var ts = ('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);
  win.contentView.addSubview(makeLabel(
    ts, textX, 22, textMaxW, 9, 'Copperplate',
    0.65, 0.55, 0.30, 0.5
  ));

  // ── Gold progress bar at bottom ──
  var progressPath = $.CGPathCreateMutable();
  var barY = 10, barLeft = textX, barRight = winW - 28;
  $.CGPathMoveToPoint(progressPath, null, barLeft, barY);
  $.CGPathAddLineToPoint(progressPath, null, barRight, barY);
  var progressLine = $.CAShapeLayer.layer;
  progressLine.setPath(progressPath);
  progressLine.setFillColor(null);
  progressLine.setStrokeColor(cg(accentR, accentG, accentB, 0.7));
  progressLine.setLineWidth(1.5);
  progressLine.setStrokeEnd(0);
  win.contentView.layer.addSublayer(progressLine);

  // ══════════════════════════════════════════════
  // CLICK-TO-DISMISS + focus correct window
  // ══════════════════════════════════════════════
  ObjC.registerSubclass({
    name: 'WarcraftDismissHandler', superclass: 'NSObject',
    methods: { 'handleDismiss': { types: ['void', []], implementation: function() {
      if (bundleId || idePid > 0) {
        var activated = false;
        if (bundleId) {
          var ws=$.NSWorkspace.sharedWorkspace, apps=ws.runningApplications;
          for (var i=0;i<apps.count;i++) {
            var app=apps.objectAtIndex(i), bid=app.bundleIdentifier;
            if (!bid.isNil() && bid.js===bundleId) {
              app.activateWithOptions($.NSApplicationActivateIgnoringOtherApps);
              activated=true; break;
            }
          }
        }
        if (!activated && idePid > 0) {
          var ideApp=$.NSRunningApplication.runningApplicationWithProcessIdentifier(idePid);
          if (ideApp && !ideApp.isNil()) ideApp.activateWithOptions($.NSApplicationActivateIgnoringOtherApps);
        }
        if (sessionTty && bundleId === 'com.googlecode.iterm2') {
          try {
            var task = $.NSTask.alloc.init;
            task.setLaunchPath($('/usr/bin/osascript'));
            task.setArguments($(['-l', 'JavaScript', '-e',
              'var iTerm=Application("iTerm2");var ws=iTerm.windows();var f=0;' +
              'for(var w=0;w<ws.length&&!f;w++){var ts=ws[w].tabs();' +
              'for(var t=0;t<ts.length&&!f;t++){var ss=ts[t].sessions();' +
              'for(var s=0;s<ss.length&&!f;s++){try{if(ss[s].tty()==="' + sessionTty + '")' +
              '{ts[t].select();ss[s].select();ws[w].index=1;f=1}}catch(e){}}}}'
            ]));
            task.launch;
          } catch(e) {}
        }
      }
      $.NSDistributedNotificationCenter.defaultCenter.postNotificationNameObject($(dismissNotificationName), $.NSString.string);
      $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
        0.05, $.NSApp, 'terminate:', null, false
      );
    }}}
  });
  var dh = $.WarcraftDismissHandler.alloc.init;
  var btn = $.NSButton.alloc.initWithFrame($.NSMakeRect(0, 0, winW, winH));
  btn.setTitle($('')); btn.setBordered(false); btn.setTransparent(true);
  btn.setTarget(dh); btn.setAction('handleDismiss');
  win.contentView.addSubview(btn);

  // ══════════════════════════════════════════════
  // ANIMATION
  // ══════════════════════════════════════════════
  win.orderFrontRegardless;
  win.animator.setAlphaValue(1.0);

  if (dismiss > 0) {
    var animSteps = 120, animInterval = dismiss / animSteps;
    var step = { val: 0 };

    ObjC.registerSubclass({
      name: 'WarcraftAnimator', superclass: 'NSObject',
      methods: { 'tick:': { types: ['void', ['id']], implementation: function(timer) {
        step.val++;
        var p = Math.min(step.val / animSteps, 1.0);
        progressLine.setStrokeEnd(p);
        if (p > 0.85) {
          var fadeP = (p - 0.85) / 0.15;
          win.setAlphaValue(0.99 - fadeP * 0.99);
        }
        if (step.val >= animSteps) {
          timer.invalidate();
          win.setAlphaValue(0.0);
          win.orderOut(null);
        }
      }}}
    });

    var anim = $.WarcraftAnimator.alloc.init;
    $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
      animInterval, anim, 'tick:', null, true);
    $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
      dismiss + 0.3, $.NSApp, 'terminate:', null, false);
  }

  // Event-driven dismissal from sibling overlays
  ObjC.registerSubclass({
    name: 'WarcraftDismissObserver',
    superclass: 'NSObject',
    methods: {
      'handleDismiss:': {
        types: ['void', ['id']],
        implementation: function(notification) {
          $.NSApp.terminate(null);
        }
      }
    }
  });
  var wcObserver = $.WarcraftDismissObserver.alloc.init;
  $.NSDistributedNotificationCenter.defaultCenter.addObserverSelectorNameObject(
    wcObserver,
    'handleDismiss:',
    $(dismissNotificationName),
    $.NSString.string
  );

  $.NSApp.run;
}
