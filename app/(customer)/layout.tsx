export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-md mx-auto">
            {children}
        </div>
    );
}