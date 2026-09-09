package id.dutaled.tvnasional;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.LinkedHashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private LinearLayout root;
    private WebView web;
    private final Map<String,String> channels = new LinkedHashMap<>();

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setFlags(1024,1024);
        channels.put("TVRI Nasional", "https://klik.tvri.go.id/detailchannel/tvri_ch_00");
        channels.put("SCTV", "https://www.vidio.com/live/204-sctv");
        channels.put("Indosiar", "https://www.vidio.com/live/205-indosiar");
        channels.put("TRANS TV", "https://www.vidio.com/live/733-trans-tv");
        channels.put("Trans7", "https://www.vidio.com/live/734-trans7");
        channels.put("MOJI", "https://www.vidio.com/live/206-moji");
        channels.put("Metro TV", "https://xtend.metrotvnews.com/");
        channels.put("Kompas TV", "https://www.vidio.com/live");
        showHome();
    }

    private TextView title(String s, int size) {
        TextView t = new TextView(this); t.setText(s); t.setTextColor(Color.WHITE); t.setTextSize(size);
        t.setTypeface(Typeface.DEFAULT, Typeface.BOLD); t.setGravity(Gravity.CENTER_VERTICAL); return t;
    }

    private void showHome() {
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(32,24,32,24); root.setBackgroundColor(Color.rgb(12,12,16));
        TextView h = title("📺  TV NASIONAL", 28); h.setGravity(Gravity.CENTER); root.addView(h, new LinearLayout.LayoutParams(-1,70));
        TextView sub = title("Pilih channel dengan tombol OK pada remote", 16); sub.setGravity(Gravity.CENTER); root.addView(sub, new LinearLayout.LayoutParams(-1,45));
        LinearLayout grid = new LinearLayout(this); grid.setOrientation(LinearLayout.VERTICAL);
        String[] names = channels.keySet().toArray(new String[0]);
        for (int row=0; row<((names.length+3)/4); row++) {
            LinearLayout r = new LinearLayout(this); r.setOrientation(LinearLayout.HORIZONTAL); r.setGravity(Gravity.CENTER);
            for (int col=0; col<4; col++) { int i=row*4+col; if(i>=names.length) break; Button bt=button(names[i]); r.addView(bt,new LinearLayout.LayoutParams(0,88,1)); }
            grid.addView(r,new LinearLayout.LayoutParams(-1,100));
        }
        root.addView(grid,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);
    }

    private Button button(final String name) {
        Button b=new Button(this); b.setText(name); b.setTextSize(17); b.setTextColor(Color.WHITE); b.setAllCaps(false); b.setFocusable(true); b.setFocusableInTouchMode(true);
        b.setOnClickListener(v -> openChannel(name));
        b.setOnFocusChangeListener((v,has)-> v.setAlpha(has?1f:.82f)); return b;
    }

    private void openChannel(String name) {
        web = new WebView(this); WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setMediaPlaybackRequiresUserGesture(false); s.setSupportZoom(false); s.setUserAgentString(s.getUserAgentString()+" TVNasional/1.0");
        web.setWebViewClient(new WebViewClient()); web.setBackgroundColor(Color.BLACK); web.loadUrl(channels.get(name));
        setContentView(web); web.requestFocus();
    }

    @Override public void onBackPressed() { if(web!=null){ web.destroy(); web=null; showHome(); } else super.onBackPressed(); }
    @Override public boolean dispatchKeyEvent(KeyEvent e) { if(e.getAction()==KeyEvent.ACTION_DOWN && e.getKeyCode()==KeyEvent.KEYCODE_BACK && web!=null){ onBackPressed(); return true; } return super.dispatchKeyEvent(e); }
    // TV box build marker
}
