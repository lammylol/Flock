// CommentsView.swift
// Flock 
//
// provides the UI for viewing and adding comments
//
// Created by Ramon Jiang 09/011/24

import SwiftUI

struct CommentsView: View {
    let postID: String
    // @StateObject private var viewModel: CommentViewModel
    var isInSheet: Bool
    @ObservedObject var viewModel: CommentViewModel
    
    @State private var newCommentText = ""
    @FocusState private var isCommentFieldFocused: Bool
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.presentationMode) var presentationMode
    
    @State private var viewModelUpdateCounter = 0
    
    var body: some View {
        VStack (alignment: .leading) {
            commentsList
            errorView
            commentInputField
        }
        .navigationTitle(isInSheet ? "" : "Comments")
        .task {
            print("CommentsView task started for post \(postID)")
            await fetchCommentsIfNeeded()
        }
        .onChange(of: postID) { newID in
            print("PostID changed to: \(newID)")
            Task {
                await fetchCommentsIfNeeded()
            }
        }
    }

    private func fetchCommentsIfNeeded() async {
        guard !postID.isEmpty else {
            print("PostID is empty, not fetching comments")
            return
        }
        await viewModel.fetchComments(for: postID)
    }
    
    private var commentsList: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if viewModel.comments.isEmpty {
                Text("No comments yet. Be the first to comment!")
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                VStack(alignment: .leading) {
                    ForEach(viewModel.comments) { comment in
                        CommentRow(comment: comment, currentUserID: userHolder.person.userID) {
                            Task {
                                await deleteComment(comment)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                }
            }
        }
    }
    
    private var errorView: some View {
        Group {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .padding(.horizontal)
            }
        }
    }
    
    private var commentInputField: some View {
        HStack {
            TextField("Add a comment", text: $newCommentText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .focused($isCommentFieldFocused)
                .submitLabel(.send)
                .onSubmit {
                    Task {
                        await postComment()
                    }
                }
            
            Button("Post") {
                Task {
                    await postComment()
                }
            }
            .disabled(isCommentTextEmpty)
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(radius: 2)
    }
    
    private var isCommentTextEmpty: Bool {
        newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func postComment() async {
        guard !isCommentTextEmpty else { return }
        await viewModel.addComment(to: postID, text: newCommentText, person: userHolder.person)
        newCommentText = ""
        isCommentFieldFocused = false
        await viewModel.fetchComments(for: postID)
    }

    private func deleteComment(_ comment: Comment) async {
        if let commentID = comment.id {
            await viewModel.deleteComment(postID: postID, commentID: commentID)
        } else {
            print("Cannot delete comment: Invalid comment ID")
        }
    }
}

struct CommentRow: View {
    let comment: Comment
    let currentUserID: String
    var onDelete: () -> Void

    @State private var showDeleteConfirmation = false
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 5) {
                Text(comment.username)
                    .font(.headline)
                Text(comment.text)
                    .font(.body)
                Text(comment.createdAt, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            if comment.userID == currentUserID {
                Button(action: {
                    showDeleteConfirmation = true
                }) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
        }
        .padding(.vertical, 5)
        .confirmationDialog(
            "Confirm delete?",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive, action: onDelete)
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This action cannot be undone.")
        }
    }
}
